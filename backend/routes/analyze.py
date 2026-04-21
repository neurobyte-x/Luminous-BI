from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends, HTTPException

from database import get_db
from models.db_models import QueryHistory, UserAccount
from models.schemas import AnalyzeRequest, AnalyzeResponse
from services.auth_service import get_current_user
from services.chart_service import validate_charts
from services.llm_service import generate_analysis
from services.pandas_service import dataframe_to_records, execute_pandas_prompt
from services.storage_service import get_dataframe


router = APIRouter()


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

    charts = validate_charts(
        charts=analysis.get("charts", []),
        dataframe=result_dataframe if not result_dataframe.empty else dataframe,
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
        insights=analysis.get("insights", []),
        charts=charts,
        data=dataframe_to_records(result_dataframe),
    )
