import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.db_models import Dashboard, DashboardSnapshot, UserAccount
from models.schemas import DashboardCreate, DashboardResponse, DeleteResponse
from services.auth_service import get_current_user


router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _to_dashboard_response(dashboard: Dashboard, snapshot: DashboardSnapshot | None) -> DashboardResponse:
    return DashboardResponse(
        id=dashboard.id,
        name=dashboard.name,
        query=dashboard.query,
        dataset_id=dashboard.dataset_id,
        charts=dashboard.charts,
        summary=snapshot.summary if snapshot else "",
        insights=snapshot.insights if snapshot else [],
        data=snapshot.data if snapshot else [],
        sql_query=snapshot.sql_query if snapshot else "",
        created_at=dashboard.created_at,
    )


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
    await db.flush()

    snapshot = DashboardSnapshot(
        dashboard_id=dashboard.id,
        summary=payload.summary,
        insights=payload.insights,
        data=payload.data,
        sql_query=payload.sql_query,
    )

    db.add(snapshot)
    await db.commit()
    await db.refresh(dashboard)
    return _to_dashboard_response(dashboard=dashboard, snapshot=snapshot)


@router.get("", response_model=list[DashboardResponse])
async def list_dashboards(
    db: AsyncSession = Depends(get_db),
    current_user: UserAccount = Depends(get_current_user),
) -> list[DashboardResponse]:
    _ = current_user
    dashboard_result = await db.execute(select(Dashboard).order_by(Dashboard.created_at.desc()))
    dashboards = list(dashboard_result.scalars().all())

    dashboard_ids = [dashboard.id for dashboard in dashboards]
    snapshots_by_dashboard_id: dict[uuid.UUID, DashboardSnapshot] = {}
    if dashboard_ids:
        snapshot_result = await db.execute(
            select(DashboardSnapshot).where(DashboardSnapshot.dashboard_id.in_(dashboard_ids))
        )
        snapshots = list(snapshot_result.scalars().all())
        snapshots_by_dashboard_id = {snapshot.dashboard_id: snapshot for snapshot in snapshots}

    return [
        _to_dashboard_response(dashboard, snapshots_by_dashboard_id.get(dashboard.id))
        for dashboard in dashboards
    ]


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

    snapshot_result = await db.execute(
        select(DashboardSnapshot).where(DashboardSnapshot.dashboard_id == dashboard.id)
    )
    snapshot = snapshot_result.scalar_one_or_none()
    return _to_dashboard_response(dashboard=dashboard, snapshot=snapshot)


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
