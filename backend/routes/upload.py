from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.db_models import UploadedDataset, UserAccount
from models.schemas import UploadResponse, UploadedDatasetItem
from services.auth_service import get_current_user
from services.storage_service import save_csv_upload_for_user


router = APIRouter()


@router.get("/upload", response_model=list[UploadedDatasetItem])
async def list_uploaded_datasets(
    db: AsyncSession = Depends(get_db),
    current_user: UserAccount = Depends(get_current_user),
) -> list[UploadedDatasetItem]:
    result = await db.execute(
        select(UploadedDataset)
        .where(UploadedDataset.user_id == current_user.id)
        .order_by(UploadedDataset.created_at.desc())
    )
    datasets = list(result.scalars().all())

    return [
        UploadedDatasetItem(
            dataset_id=dataset.dataset_id,
            filename=dataset.original_filename,
            columns=[str(column) for column in dataset.columns],
            rows=int(dataset.row_count),
            created_at=dataset.created_at,
        )
        for dataset in datasets
    ]


@router.post("/upload", response_model=UploadResponse)
async def upload_dataset(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: UserAccount = Depends(get_current_user),
) -> UploadResponse:
    try:
        dataset_id, saved_path, dataframe = await save_csv_upload_for_user(file, current_user.id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    dataset = UploadedDataset(
        user_id=current_user.id,
        dataset_id=dataset_id,
        original_filename=file.filename or Path(saved_path).name,
        stored_path=saved_path,
        row_count=int(len(dataframe)),
        columns=[str(column) for column in dataframe.columns.tolist()],
    )
    db.add(dataset)
    await db.commit()

    return UploadResponse(
        dataset_id=dataset_id,
        filename=dataset.original_filename,
        columns=[str(column) for column in dataframe.columns.tolist()],
        rows=int(len(dataframe)),
    )
