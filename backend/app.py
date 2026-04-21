import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import close_db, init_db
from routes.analyze import router as analyze_router
from routes.auth import router as auth_router
from routes.dashboard import router as dashboard_router
from routes.history import router as history_router
from routes.upload import router as upload_router


logger = logging.getLogger(__name__)


app = FastAPI(title="Conversational Data Dashboard API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup() -> None:
    settings.uploads_dir.mkdir(parents=True, exist_ok=True)
    try:
        await init_db()
    except Exception as exc:
        logger.warning("Database init skipped: %s", exc)


@app.on_event("shutdown")
async def on_shutdown() -> None:
    await close_db()


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(upload_router, tags=["upload"])
app.include_router(auth_router)
app.include_router(analyze_router, tags=["analyze"])
app.include_router(history_router)
app.include_router(dashboard_router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
