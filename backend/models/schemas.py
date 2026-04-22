import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class UploadResponse(BaseModel):
    dataset_id: str
    filename: str
    columns: list[str]
    rows: int


class UploadedDatasetItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    dataset_id: str
    filename: str
    columns: list[str]
    rows: int
    created_at: datetime


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


class DecisionCopilotRequest(BaseModel):
    dataset_id: str = Field(min_length=1)
    context_query: str = Field(min_length=1)


class DecisionAction(BaseModel):
    rank: int
    title: str
    rationale: str
    expected_impact: str
    confidence: int = Field(ge=0, le=100)


class DecisionCopilotResponse(BaseModel):
    headline: str
    actions: list[DecisionAction]


class WhatIfRequest(BaseModel):
    dataset_id: str = Field(min_length=1)
    scenario_prompt: str = Field(min_length=3)


class WhatIfProjection(BaseModel):
    metric: str
    baseline: float
    projected: float
    low: float
    high: float
    unit: str


class WhatIfResponse(BaseModel):
    scenario: str
    assumptions: list[str]
    projections: list[WhatIfProjection]
    sample_size: int
    matched_filters: dict[str, str] = Field(default_factory=dict)


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
    summary: str = ""
    insights: list[str] = Field(default_factory=list)
    data: list[dict[str, Any]] = Field(default_factory=list)
    sql_query: str = ""


class DashboardResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    query: str
    dataset_id: str
    charts: list[dict[str, Any]]
    summary: str = ""
    insights: list[str] = Field(default_factory=list)
    data: list[dict[str, Any]] = Field(default_factory=list)
    sql_query: str = ""
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
