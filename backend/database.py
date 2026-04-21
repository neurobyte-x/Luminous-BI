from collections.abc import AsyncGenerator

from sqlalchemy.engine import URL, make_url
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from config import settings


def _normalize_database_url(raw_url: str) -> str:
    parsed: URL = make_url(raw_url)

    if parsed.drivername in {"postgresql", "postgres", "postgresql+psycopg2", "postgresql+psycopg"}:
        parsed = parsed.set(drivername="postgresql+asyncpg")

    query = dict(parsed.query)

    # asyncpg expects `ssl`, while many Neon URLs use `sslmode=require`.
    if parsed.drivername == "postgresql+asyncpg" and "sslmode" in query and "ssl" not in query:
        sslmode = str(query.pop("sslmode"))
        query["ssl"] = "require" if sslmode == "require" else sslmode

    # This parameter is for psycopg and is not supported by asyncpg.
    query.pop("channel_binding", None)

    normalized = parsed.set(query=query)
    return normalized.render_as_string(hide_password=False)


engine = (
    create_async_engine(
        _normalize_database_url(settings.database_url),
        echo=False,
        future=True,
        pool_pre_ping=True,
    )
    if settings.database_url
    else None
)

AsyncSessionLocal = (
    async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    if engine is not None
    else None
)

Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    if AsyncSessionLocal is None:
        raise RuntimeError("DATABASE_URL is missing. Set it in your environment.")

    async with AsyncSessionLocal() as session:
        yield session


async def init_db() -> None:
    if engine is None:
        raise RuntimeError("DATABASE_URL is missing. Cannot initialize database.")

    from models import db_models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    if engine is not None:
        await engine.dispose()
