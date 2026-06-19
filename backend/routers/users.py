from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from schemas import ProfileResponse
from models import User
from auth import get_current_user
import crud

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=ProfileResponse)
def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    total_orders = crud.get_user_total_orders(db, current_user.id)
    total_referrals = crud.get_user_total_referrals(db, current_user.id)
    lifetime_earnings = crud.get_user_lifetime_earnings(db, current_user.id)

    return ProfileResponse(
        id=current_user.id,
        full_name=current_user.full_name,
        phone=current_user.phone,
        referral_code=current_user.referral_code,
        wallet_balance=current_user.wallet_balance,
        total_orders=total_orders,
        total_referrals=total_referrals,
        lifetime_earnings=lifetime_earnings,
        created_at=current_user.created_at,
    )
