from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from database import get_db
from schemas import (
    RegisterRequest, LoginRequest, AuthResponse,
    OwnerLoginRequest, OwnerAuthResponse, MessageResponse, UserResponse
)
import crud
import auth as auth_utils
from settings import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    # Check phone uniqueness
    if crud.get_user_by_phone(db, payload.phone):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this phone number already exists.",
        )

    # Resolve referral code
    referred_by_user_id = None
    if payload.referral_code:
        referrer = crud.get_user_by_referral_code(db, payload.referral_code)
        if not referrer:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid referral code.",
            )
        referred_by_user_id = referrer.id

    password_hash = auth_utils.hash_password(payload.password)
    referral_code = auth_utils.generate_referral_code(db)

    user = crud.create_user(
        db=db,
        full_name=payload.full_name,
        phone=payload.phone,
        password_hash=password_hash,
        referral_code=referral_code,
        referred_by_user_id=referred_by_user_id,
    )

    token = auth_utils.create_user_session(db, user.id)

    return AuthResponse(
        token=token,
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = crud.get_user_by_phone(db, payload.phone)

    if not user or not auth_utils.verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone number or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Please contact support.",
        )

    token = auth_utils.create_user_session(db, user.id)

    return AuthResponse(
        token=token,
        user=UserResponse.model_validate(user),
    )


@router.post("/logout", response_model=MessageResponse)
def logout(
    authorization: str = Header(default=""),
    db: Session = Depends(get_db),
):
    token = authorization.replace("Bearer ", "").strip()
    auth_utils.invalidate_session(db, token)
    return MessageResponse(message="Logged out successfully.")


@router.post("/owner/login", response_model=OwnerAuthResponse)
def owner_login(payload: OwnerLoginRequest):
    if not auth_utils.verify_owner_credentials(payload.username, payload.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid owner credentials.",
        )
    return OwnerAuthResponse(
        token=settings.OWNER_SESSION_TOKEN,
        message="Owner login successful.",
    )
