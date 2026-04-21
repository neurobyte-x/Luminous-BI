from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.db_models import QueryHistory, UserAccount
from models.schemas import HistoryItem
from services.auth_service import get_current_user


router = APIRouter(prefix="/history", tags=["history"])


@router.get("", response_model=list[HistoryItem])
async def get_history(
    db: AsyncSession = Depends(get_db),
    current_user: UserAccount = Depends(get_current_user),
) -> list[HistoryItem]:
    _ = current_user
    result = await db.execute(
        select(QueryHistory).order_by(QueryHistory.created_at.desc())
    )
    return list(result.scalars().all())
