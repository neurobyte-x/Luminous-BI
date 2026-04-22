from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends, HTTPException
import pandas as pd
from sqlalchemy import select

from database import get_db
from models.db_models import QueryHistory, UploadedDataset, UserAccount
from models.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    DecisionAction,
    DecisionCopilotRequest,
    DecisionCopilotResponse,
    WhatIfProjection,
    WhatIfRequest,
    WhatIfResponse,
)
from services.auth_service import get_current_user
from services.chart_service import validate_charts
from services.decision_service import build_decision_actions, parse_what_if_scenario, run_what_if_projection
from services.llm_service import generate_analysis
from services.pandas_service import dataframe_to_records, execute_sql_query
from services.storage_service import get_dataframe, load_dataframe_from_path


router = APIRouter()


async def _load_user_dataset_dataframe(
    dataset_id: str,
    db: AsyncSession,
    current_user: UserAccount,
) -> pd.DataFrame:
    dataset_result = await db.execute(
        select(UploadedDataset).where(
            UploadedDataset.dataset_id == dataset_id,
            UploadedDataset.user_id == current_user.id,
        )
    )
    uploaded_dataset = dataset_result.scalar_one_or_none()
    if uploaded_dataset is None:
        raise HTTPException(status_code=404, detail="Dataset not found for this user. Upload the CSV first.")

    dataframe = get_dataframe(dataset_id)
    if dataframe is None:
        try:
            dataframe = load_dataframe_from_path(dataset_id, uploaded_dataset.stored_path)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    return dataframe


def _is_generic_insight(insight: str) -> bool:
    lowered = insight.lower()
    generic_markers = ["fallback", "failed validation", "api key", "model response unavailable"]
    return any(marker in lowered for marker in generic_markers)


def _build_dataframe_insights(dataframe: pd.DataFrame) -> list[str]:
    insights: list[str] = []

    row_count, column_count = dataframe.shape
    insights.append(f"Result contains {row_count} rows across {column_count} columns.")

    numeric_columns = dataframe.select_dtypes(include=["number"]).columns.tolist()
    if numeric_columns:
        key_column = numeric_columns[0]
        series = dataframe[key_column].dropna()
        if not series.empty:
            insights.append(
                f"{key_column} ranges from {series.min():.2f} to {series.max():.2f} with an average of {series.mean():.2f}."
            )

    categorical_columns = dataframe.select_dtypes(exclude=["number", "datetime64[ns]"]).columns.tolist()
    if categorical_columns:
        cat_column = categorical_columns[0]
        top_values = dataframe[cat_column].dropna().value_counts().head(1)
        if not top_values.empty:
            top_label = str(top_values.index[0])
            top_count = int(top_values.iloc[0])
            insights.append(f"Most frequent {cat_column} value is '{top_label}' ({top_count} rows).")

    return insights[:5]


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_dataset(
    payload: AnalyzeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserAccount = Depends(get_current_user),
) -> AnalyzeResponse:
    dataframe = await _load_user_dataset_dataframe(
        dataset_id=payload.dataset_id,
        db=db,
        current_user=current_user,
    )

    columns = [str(column) for column in dataframe.columns.tolist()]
    analysis = generate_analysis(query=payload.query, columns=columns)

    try:
        result_dataframe = execute_sql_query(
            dataframe=dataframe,
            sql_query=str(analysis.get("sql_query", "")).strip(),
        )
    except ValueError:
        result_dataframe = dataframe.head(200).copy()

    response_dataframe = result_dataframe if not result_dataframe.empty else dataframe.head(200).copy()

    model_insights = [item for item in analysis.get("insights", []) if item and str(item).strip()]
    insights = [str(item).strip() for item in model_insights if not _is_generic_insight(str(item))]

    if len(insights) < 2:
        insights = _build_dataframe_insights(response_dataframe)

    charts = validate_charts(
        charts=analysis.get("charts", []),
        dataframe=response_dataframe,
    )

    history_item = QueryHistory(
        query=payload.query,
        dataset_id=payload.dataset_id,
        summary=analysis["summary"],
    )
    db.add(history_item)
    await db.commit()

    return AnalyzeResponse(
        summary=analysis["summary"],
        insights=insights,
        charts=charts,
        data=dataframe_to_records(response_dataframe),
        sql_query=str(analysis.get("sql_query", "")).strip(),
    )


@router.post("/decision-copilot", response_model=DecisionCopilotResponse)
async def decision_copilot(
    payload: DecisionCopilotRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserAccount = Depends(get_current_user),
) -> DecisionCopilotResponse:
    dataframe = await _load_user_dataset_dataframe(
        dataset_id=payload.dataset_id,
        db=db,
        current_user=current_user,
    )

    headline, actions = build_decision_actions(dataframe=dataframe, context_query=payload.context_query)
    return DecisionCopilotResponse(
        headline=headline,
        actions=[
            DecisionAction(
                rank=index + 1,
                title=action.title,
                rationale=action.rationale,
                expected_impact=action.expected_impact,
                confidence=action.confidence,
            )
            for index, action in enumerate(actions)
        ],
    )


@router.post("/what-if", response_model=WhatIfResponse)
async def what_if_simulator(
    payload: WhatIfRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserAccount = Depends(get_current_user),
) -> WhatIfResponse:
    dataframe = await _load_user_dataset_dataframe(
        dataset_id=payload.dataset_id,
        db=db,
        current_user=current_user,
    )

    try:
        scenario = parse_what_if_scenario(prompt=payload.scenario_prompt, dataframe=dataframe)
        projections, assumptions, matched_filters, sample_size = run_what_if_projection(
            dataframe=dataframe,
            scenario=scenario,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return WhatIfResponse(
        scenario=payload.scenario_prompt,
        assumptions=assumptions,
        projections=[WhatIfProjection(**projection) for projection in projections],
        sample_size=sample_size,
        matched_filters=matched_filters,
    )
