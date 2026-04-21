import uuid
from pathlib import Path

import pandas as pd
from fastapi import UploadFile

from config import settings


DATAFRAME_STORE: dict[str, pd.DataFrame] = {}


def _sanitize_filename(filename: str) -> str:
    raw_name = Path(filename).name
    cleaned = "".join(ch for ch in raw_name if ch.isalnum() or ch in {"_", "-", "."})
    return cleaned or "dataset.csv"


async def save_csv_upload(file: UploadFile) -> tuple[str, str, pd.DataFrame]:
    if not file.filename:
        raise ValueError("Missing filename.")

    safe_name = _sanitize_filename(file.filename)
    if not safe_name.lower().endswith(".csv"):
        raise ValueError("Only CSV files are supported.")

    dataset_id = str(uuid.uuid4())
    settings.uploads_dir.mkdir(parents=True, exist_ok=True)
    target_path = settings.uploads_dir / f"{dataset_id}_{safe_name}"

    content = await file.read()
    if not content:
        raise ValueError("Uploaded file is empty.")

    target_path.write_bytes(content)

    try:
        dataframe = pd.read_csv(target_path)
    except Exception as exc:
        target_path.unlink(missing_ok=True)
        raise ValueError(f"Unable to parse CSV: {exc}") from exc

    if dataframe.columns.empty:
        raise ValueError("CSV has no columns.")

    DATAFRAME_STORE[dataset_id] = dataframe
    return dataset_id, str(target_path), dataframe


def get_dataframe(dataset_id: str) -> pd.DataFrame | None:
    return DATAFRAME_STORE.get(dataset_id)
