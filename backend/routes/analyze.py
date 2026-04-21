from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends, HTTPException
import pandas as pd

from database import get_db
from models.db_models import QueryHistory, UserAccount
from models.schemas import AnalyzeRequest, AnalyzeResponse
from services.auth_service import get_current_user
from services.chart_service import validate_charts
from services.llm_service import generate_analysis
from services.pandas_service import dataframe_to_records, execute_pandas_prompt
from services.storage_service import get_dataframe


router = APIRouter()


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
    _ = current_user
    dataframe = get_dataframe(payload.dataset_id)
    if dataframe is None:
        raise HTTPException(status_code=404, detail="Dataset not found in memory. Upload the CSV first.")

    columns = [str(column) for column in dataframe.columns.tolist()]
    analysis = generate_analysis(query=payload.query, columns=columns)

    result_dataframe = execute_pandas_prompt(
        dataframe=dataframe,
        pandas_prompt=analysis["pandas_prompt"],
    )

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
