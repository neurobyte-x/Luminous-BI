from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.db_models import AuthSession, UserAccount
from models.schemas import AuthResponse, MessageResponse, SignInRequest, SignUpRequest, UserPublic
from services.auth_service import (
    generate_access_token,
    get_current_session,
    get_current_user,
    hash_password,
    hash_token,
    make_session_expiry,
    normalize_email,
    verify_password,
)


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: SignUpRequest, db: AsyncSession = Depends(get_db)) -> AuthResponse:
    email = normalize_email(payload.email)

    existing_user_result = await db.execute(select(UserAccount).where(UserAccount.email == email))
    existing_user = existing_user_result.scalar_one_or_none()
    if existing_user is not None:
        raise HTTPException(status_code=409, detail="Email already registered.")

    user = UserAccount(
        email=email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name.strip() if payload.full_name else None,
    )
    db.add(user)
    await db.flush()

    raw_token = generate_access_token()
    session = AuthSession(
        user_id=user.id,
        token_hash=hash_token(raw_token),
        expires_at=make_session_expiry(),
    )
    db.add(session)
    await db.commit()
    await db.refresh(user)

    return AuthResponse(access_token=raw_token, user=UserPublic.model_validate(user))


@router.post("/signin", response_model=AuthResponse)
async def signin(payload: SignInRequest, db: AsyncSession = Depends(get_db)) -> AuthResponse:
    email = normalize_email(payload.email)
    user_result = await db.execute(select(UserAccount).where(UserAccount.email == email))
    user = user_result.scalar_one_or_none()

    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    raw_token = generate_access_token()
    session = AuthSession(
        user_id=user.id,
        token_hash=hash_token(raw_token),
        expires_at=make_session_expiry(),
    )
    db.add(session)
    await db.commit()

    return AuthResponse(access_token=raw_token, user=UserPublic.model_validate(user))


@router.post("/login", response_model=AuthResponse)
async def login(payload: SignInRequest, db: AsyncSession = Depends(get_db)) -> AuthResponse:
    return await signin(payload=payload, db=db)


@router.post("/logout", response_model=MessageResponse)
@router.post("/signout", response_model=MessageResponse)
async def logout(
    session: AuthSession = Depends(get_current_session),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    if session.revoked_at is None:
        from datetime import UTC, datetime

        session.revoked_at = datetime.now(UTC)
        db.add(session)
        await db.commit()

    return MessageResponse(message="Signed out successfully.")


@router.get("/me", response_model=UserPublic)
async def me(current_user: UserAccount = Depends(get_current_user)) -> UserPublic:
    return UserPublic.model_validate(current_user)
