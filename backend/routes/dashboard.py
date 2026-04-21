import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.db_models import Dashboard, UserAccount
from models.schemas import DashboardCreate, DashboardResponse, DeleteResponse
from services.auth_service import get_current_user


router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.post("", response_model=DashboardResponse)
async def create_dashboard(
    payload: DashboardCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UserAccount = Depends(get_current_user),
) -> DashboardResponse:
    _ = current_user
    dashboard = Dashboard(
        name=payload.name,
        query=payload.query,
        dataset_id=payload.dataset_id,
        charts=[chart.model_dump(exclude_none=True) for chart in payload.charts],
    )

    db.add(dashboard)
    await db.commit()
    await db.refresh(dashboard)
    return dashboard


@router.get("", response_model=list[DashboardResponse])
async def list_dashboards(
    db: AsyncSession = Depends(get_db),
    current_user: UserAccount = Depends(get_current_user),
) -> list[DashboardResponse]:
    _ = current_user
    result = await db.execute(select(Dashboard).order_by(Dashboard.created_at.desc()))
    return list(result.scalars().all())


@router.get("/{dashboard_id}", response_model=DashboardResponse)
async def get_dashboard(
    dashboard_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserAccount = Depends(get_current_user),
) -> DashboardResponse:
    _ = current_user
    result = await db.execute(select(Dashboard).where(Dashboard.id == dashboard_id))
    dashboard = result.scalar_one_or_none()
    if dashboard is None:
        raise HTTPException(status_code=404, detail="Dashboard not found.")
    return dashboard


@router.delete("/{dashboard_id}", response_model=DeleteResponse)
async def delete_dashboard(
    dashboard_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserAccount = Depends(get_current_user),
) -> DeleteResponse:
    _ = current_user
    result = await db.execute(select(Dashboard).where(Dashboard.id == dashboard_id))
    dashboard = result.scalar_one_or_none()
    if dashboard is None:
        raise HTTPException(status_code=404, detail="Dashboard not found.")

    await db.delete(dashboard)
    await db.commit()
    return DeleteResponse(message="Dashboard deleted successfully.")
