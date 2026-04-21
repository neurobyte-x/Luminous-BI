from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from models.db_models import UserAccount
from models.schemas import UploadResponse
from services.auth_service import get_current_user
from services.storage_service import save_csv_upload


router = APIRouter()


@router.post("/upload", response_model=UploadResponse)
async def upload_dataset(
    file: UploadFile = File(...),
    current_user: UserAccount = Depends(get_current_user),
) -> UploadResponse:
    _ = current_user
    try:
        dataset_id, saved_path, dataframe = await save_csv_upload(file)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return UploadResponse(
        dataset_id=dataset_id,
        filename=Path(saved_path).name,
        columns=[str(column) for column in dataframe.columns.tolist()],
        rows=int(len(dataframe)),
    )
