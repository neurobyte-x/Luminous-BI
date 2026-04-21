import hashlib
import hmac
import secrets
from datetime import UTC, datetime, timedelta

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.db_models import AuthSession, UserAccount


TOKEN_TTL_DAYS = 7
bearer_scheme = HTTPBearer(auto_error=False)


def normalize_email(email: str) -> str:
    return email.strip().lower()


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        bytes.fromhex(salt),
        200_000,
    ).hex()
    return f"{salt}${digest}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt, expected_digest = stored_hash.split("$", maxsplit=1)
    except ValueError:
        return False

    computed_digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        bytes.fromhex(salt),
        200_000,
    ).hex()
    return hmac.compare_digest(computed_digest, expected_digest)


def generate_access_token() -> str:
    return secrets.token_urlsafe(48)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def make_session_expiry() -> datetime:
    return datetime.now(UTC) + timedelta(days=TOKEN_TTL_DAYS)


async def get_current_session(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> AuthSession:
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )

    token_digest = hash_token(credentials.credentials)
    now = datetime.now(UTC)

    result = await db.execute(
        select(AuthSession).where(
            and_(
                AuthSession.token_hash == token_digest,
                AuthSession.revoked_at.is_(None),
                AuthSession.expires_at > now,
            )
        )
    )
    session = result.scalar_one_or_none()

    if session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
        )

    return session


async def get_current_user(
    session: AuthSession = Depends(get_current_session),
    db: AsyncSession = Depends(get_db),
) -> UserAccount:
    result = await db.execute(select(UserAccount).where(UserAccount.id == session.user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User does not exist.",
        )

    return user
