import os
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel, ConfigDict, Field

load_dotenv()


class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")

    database_url: str = Field(default_factory=lambda: os.getenv("DATABASE_URL", ""))
    llm_primary_provider: str = Field(default_factory=lambda: os.getenv("LLM_PRIMARY_PROVIDER", "gemini"))
    llm_fallback_provider: str = Field(default_factory=lambda: os.getenv("LLM_FALLBACK_PROVIDER", "openrouter"))
    gemini_api_key: str = Field(default_factory=lambda: os.getenv("GEMINI_API_KEY", ""))
    gemini_model: str = Field(default_factory=lambda: os.getenv("GEMINI_MODEL", "gemini-2.5-flash"))
    openrouter_api_key: str = Field(default_factory=lambda: os.getenv("OPENROUTER_API_KEY", ""))
    openrouter_model: str = Field(
        default_factory=lambda: os.getenv("OPENROUTER_MODEL", "deepseek/deepseek-chat")
    )
    openrouter_base_url: str = Field(
        default_factory=lambda: os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
    )
    openrouter_site_url: str = Field(default_factory=lambda: os.getenv("OPENROUTER_SITE_URL", ""))
    openrouter_app_name: str = Field(default_factory=lambda: os.getenv("OPENROUTER_APP_NAME", "Luminous BI"))
    supabase_url: str = Field(default_factory=lambda: os.getenv("SUPABASE_URL", ""))
    supabase_service_key: str = Field(default_factory=lambda: os.getenv("SUPABASE_SERVICE_KEY", ""))
    supabase_storage_bucket: str = Field(default_factory=lambda: os.getenv("SUPABASE_STORAGE_BUCKET", "csv-uploads"))
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
