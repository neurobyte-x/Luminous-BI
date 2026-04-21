import os
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel, ConfigDict, Field

load_dotenv()


class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")

    database_url: str = Field(default_factory=lambda: os.getenv("DATABASE_URL", ""))
    gemini_api_key: str = Field(default_factory=lambda: os.getenv("GEMINI_API_KEY", ""))
    gemini_model: str = Field(default_factory=lambda: os.getenv("GEMINI_MODEL", "gemini-2.5-flash"))
    uploads_dir: Path = Field(
        default_factory=lambda: Path(__file__).resolve().parent / "data" / "uploads"
    )
    cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]
    )


settings = Settings()
