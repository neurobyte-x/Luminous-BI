import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class UploadResponse(BaseModel):
    dataset_id: str
    filename: str
    columns: list[str]
    rows: int


class AnalyzeRequest(BaseModel):
    query: str = Field(min_length=1)
    dataset_id: str = Field(min_length=1)


class ChartSpec(BaseModel):
    type: str
    x: str
    y: str
    group_by: str | None = None


class AnalyzeResponse(BaseModel):
    summary: str
    insights: list[str]
    charts: list[ChartSpec]
    data: list[dict[str, Any]]
    sql_query: str


class HistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    query: str
    dataset_id: str
    summary: str
    created_at: datetime


class DashboardCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    query: str = Field(min_length=1)
    dataset_id: str = Field(min_length=1)
    charts: list[ChartSpec] = Field(default_factory=list)


class DashboardResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    query: str
    dataset_id: str
    charts: list[dict[str, Any]]
    created_at: datetime


class DeleteResponse(BaseModel):
    message: str


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    full_name: str | None = None
    created_at: datetime


class SignUpRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)


class SignInRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=8, max_length=128)


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class MessageResponse(BaseModel):
    message: str
