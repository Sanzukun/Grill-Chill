from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from schemas import WalletResponse, WalletTransactionResponse
from models import User
from auth import get_current_user
import crud

router = APIRouter(prefix="/wallet", tags=["Wallet"])


@router.get("/", response_model=WalletResponse)
def get_wallet(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    transactions = crud.get_wallet_transactions(db, current_user.id)
    return WalletResponse(
        balance=current_user.wallet_balance,
        transactions=[
            WalletTransactionResponse(
                id=txn.id,
                order_id=txn.order_id,
                transaction_type=txn.transaction_type,
                reason=txn.reason,
                amount=txn.amount,
                balance_after=txn.balance_after,
                note=txn.note,
                created_at=txn.created_at,
            )
            for txn in transactions
        ],
    )
