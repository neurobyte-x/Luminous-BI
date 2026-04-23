import uuid
from io import BytesIO
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

import pandas as pd
from fastapi import UploadFile

from config import settings


DATAFRAME_STORE: dict[str, pd.DataFrame] = {}


def _sanitize_filename(filename: str) -> str:
    raw_name = Path(filename).name
    cleaned = "".join(ch for ch in raw_name if ch.isalnum() or ch in {"_", "-", "."})
    return cleaned or "dataset.csv"


def _normalize_supabase_base_url(raw_url: str) -> str:
    base = raw_url.strip().rstrip("/")
    if not base:
        return ""
    if base.endswith("/rest/v1"):
        return base[: -len("/rest/v1")]
    return base


def _get_supabase_config() -> tuple[str, str, str]:
    base_url = _normalize_supabase_base_url(settings.supabase_url)
    service_key = settings.supabase_service_key.strip()
    bucket = settings.supabase_storage_bucket.strip()
    if not base_url or not service_key or not bucket:
        raise ValueError(
            "Supabase storage is not configured. Set SUPABASE_URL, SUPABASE_SERVICE_KEY, and SUPABASE_STORAGE_BUCKET."
        )
    return base_url, service_key, bucket


def _build_object_name(user_id: uuid.UUID | None, dataset_id: str, safe_name: str) -> str:
    user_segment = str(user_id) if user_id is not None else "public"
    return f"{user_segment}/{dataset_id}_{safe_name}"


def _upload_to_supabase(content: bytes, object_name: str) -> str:
    base_url, service_key, bucket = _get_supabase_config()
    encoded_name = quote(object_name, safe="/-_.")
    endpoint = f"{base_url}/storage/v1/object/{bucket}/{encoded_name}"
    request = Request(
        endpoint,
        data=content,
        method="POST",
        headers={
            "Authorization": f"Bearer {service_key}",
            "apikey": service_key,
            "x-upsert": "true",
            "Content-Type": "text/csv",
        },
    )
    try:
        with urlopen(request):
            pass
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise ValueError(f"Supabase upload failed: {exc.code} {detail}") from exc
    except URLError as exc:
        raise ValueError(f"Supabase upload failed: {exc.reason}") from exc

    return f"supabase://{bucket}/{object_name}"


def _download_from_supabase(stored_path: str) -> bytes:
    if not stored_path.startswith("supabase://"):
        raise ValueError("Stored path is not a Supabase object path.")

    location = stored_path[len("supabase://") :]
    bucket, separator, object_name = location.partition("/")
    if not separator or not bucket or not object_name:
        raise ValueError("Invalid Supabase object path.")

    base_url, service_key, _ = _get_supabase_config()
    encoded_name = quote(object_name, safe="/-_.")
    endpoint = f"{base_url}/storage/v1/object/{bucket}/{encoded_name}"
    request = Request(
        endpoint,
        method="GET",
        headers={
            "Authorization": f"Bearer {service_key}",
            "apikey": service_key,
        },
    )

    try:
        with urlopen(request) as response:
            return response.read()
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise ValueError(f"Supabase download failed: {exc.code} {detail}") from exc
    except URLError as exc:
        raise ValueError(f"Supabase download failed: {exc.reason}") from exc


async def save_csv_upload(file: UploadFile) -> tuple[str, str, pd.DataFrame]:
    if not file.filename:
        raise ValueError("Missing filename.")

    safe_name = _sanitize_filename(file.filename)
    if not safe_name.lower().endswith(".csv"):
        raise ValueError("Only CSV files are supported.")

    dataset_id = str(uuid.uuid4())

    content = await file.read()
    if not content:
        raise ValueError("Uploaded file is empty.")

    object_name = _build_object_name(user_id=None, dataset_id=dataset_id, safe_name=safe_name)

    try:
        dataframe = pd.read_csv(BytesIO(content))
    except Exception as exc:
        raise ValueError(f"Unable to parse CSV: {exc}") from exc

    if dataframe.columns.empty:
        raise ValueError("CSV has no columns.")

    stored_path = _upload_to_supabase(content=content, object_name=object_name)

    DATAFRAME_STORE[dataset_id] = dataframe
    return dataset_id, stored_path, dataframe


async def save_csv_upload_for_user(
    file: UploadFile,
    user_id: uuid.UUID,
) -> tuple[str, str, pd.DataFrame]:
    if not file.filename:
        raise ValueError("Missing filename.")

    safe_name = _sanitize_filename(file.filename)
    if not safe_name.lower().endswith(".csv"):
        raise ValueError("Only CSV files are supported.")

    dataset_id = str(uuid.uuid4())

    content = await file.read()
    if not content:
        raise ValueError("Uploaded file is empty.")

    object_name = _build_object_name(user_id=user_id, dataset_id=dataset_id, safe_name=safe_name)

    try:
        dataframe = pd.read_csv(BytesIO(content))
    except Exception as exc:
        raise ValueError(f"Unable to parse CSV: {exc}") from exc

    if dataframe.columns.empty:
        raise ValueError("CSV has no columns.")

    stored_path = _upload_to_supabase(content=content, object_name=object_name)

    DATAFRAME_STORE[dataset_id] = dataframe
    return dataset_id, stored_path, dataframe


def get_dataframe(dataset_id: str) -> pd.DataFrame | None:
    return DATAFRAME_STORE.get(dataset_id)


def load_dataframe_from_path(dataset_id: str, stored_path: str) -> pd.DataFrame:
    try:
        if not stored_path.startswith("supabase://"):
            raise ValueError("Dataset storage path is not in Supabase format. Re-upload the CSV.")

        content = _download_from_supabase(stored_path)
        dataframe = pd.read_csv(BytesIO(content))
    except Exception as exc:
        raise ValueError(f"Unable to read saved CSV: {exc}") from exc

    if dataframe.columns.empty:
        raise ValueError("Saved CSV has no columns.")

    DATAFRAME_STORE[dataset_id] = dataframe
    return dataframe
