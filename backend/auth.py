import bcrypt
import secrets
import string
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from models import User, UserSession
from settings import settings


# ---------------------------------------------------------------------------
# Password utilities
# ---------------------------------------------------------------------------

def hash_password(plain_password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(plain_password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8")
    )


# ---------------------------------------------------------------------------
# Referral code generation
# ---------------------------------------------------------------------------

def generate_referral_code(db: Session) -> str:
    chars = string.ascii_uppercase + string.digits
    while True:
        code = "GC" + "".join(secrets.choice(chars) for _ in range(5))
        existing = db.query(User).filter(User.referral_code == code).first()
        if not existing:
            return code


# ---------------------------------------------------------------------------
# Session token utilities
# ---------------------------------------------------------------------------

def create_session_token() -> str:
    return secrets.token_urlsafe(48)


def create_user_session(db: Session, user_id: int) -> str:
    token = create_session_token()
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.SESSION_EXPIRE_DAYS)

    session = UserSession(
        user_id=user_id,
        token=token,
        expires_at=expires_at,
        is_active=True,
    )
    db.add(session)
    db.commit()
    return token


def get_user_from_token(db: Session, token: str) -> User | None:
    if not token:
        return None

    now = datetime.now(timezone.utc)
    session = (
        db.query(UserSession)
        .filter(
            UserSession.token == token,
            UserSession.is_active == True,
            UserSession.expires_at > now,
        )
        .first()
    )

    if not session:
        return None

    return session.user


def invalidate_session(db: Session, token: str) -> bool:
    session = db.query(UserSession).filter(UserSession.token == token).first()
    if session:
        session.is_active = False
        db.commit()
        return True
    return False


def invalidate_all_user_sessions(db: Session, user_id: int) -> None:
    db.query(UserSession).filter(
        UserSession.user_id == user_id,
        UserSession.is_active == True,
    ).update({"is_active": False})
    db.commit()


# ---------------------------------------------------------------------------
# Owner authentication
# ---------------------------------------------------------------------------

def verify_owner_credentials(username: str, password: str) -> bool:
    return (
        username == settings.OWNER_USERNAME
        and password == settings.OWNER_PASSWORD
    )


def verify_owner_token(token: str) -> bool:
    return token == settings.OWNER_SESSION_TOKEN


# ---------------------------------------------------------------------------
# FastAPI dependency helpers
# ---------------------------------------------------------------------------

from fastapi import Header, HTTPException, status, Depends
from sqlalchemy.orm import Session
from database import get_db


def get_current_user(
    authorization: str = Header(default=""),
    db: Session = Depends(get_db),
) -> User:
    token = authorization.replace("Bearer ", "").strip()
    user = get_user_from_token(db, token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session. Please login again.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive.",
        )
    return user


def get_optional_user(
    authorization: str = Header(default=""),
    db: Session = Depends(get_db),
) -> User | None:
    token = authorization.replace("Bearer ", "").strip()
    if not token:
        return None
    return get_user_from_token(db, token)


def require_owner(
    authorization: str = Header(default=""),
) -> None:
    token = authorization.replace("Bearer ", "").strip()
    if not verify_owner_token(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Owner authentication required.",
        )
