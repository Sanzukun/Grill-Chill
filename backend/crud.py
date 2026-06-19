from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc
from typing import Optional
from models import (
    User, Product, Category, Order, OrderItem,
    WalletTransaction, OrderStatus, TransactionType, TransactionReason
)
from settings import settings


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_phone(db: Session, phone: str) -> Optional[User]:
    return db.query(User).filter(User.phone == phone).first()


def get_user_by_referral_code(db: Session, code: str) -> Optional[User]:
    return db.query(User).filter(User.referral_code == code.upper()).first()


def create_user(
    db: Session,
    full_name: str,
    phone: str,
    password_hash: str,
    referral_code: str,
    referred_by_user_id: Optional[int] = None,
) -> User:
    user = User(
        full_name=full_name,
        phone=phone,
        password_hash=password_hash,
        referral_code=referral_code,
        referred_by_user_id=referred_by_user_id,
        wallet_balance=0.0,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_user_total_orders(db: Session, user_id: int) -> int:
    return (
        db.query(func.count(Order.id))
        .filter(Order.user_id == user_id)
        .scalar() or 0
    )


def get_user_total_referrals(db: Session, user_id: int) -> int:
    return (
        db.query(func.count(User.id))
        .filter(User.referred_by_user_id == user_id)
        .scalar() or 0
    )


def get_user_lifetime_earnings(db: Session, user_id: int) -> float:
    result = (
        db.query(func.sum(WalletTransaction.amount))
        .filter(
            WalletTransaction.user_id == user_id,
            WalletTransaction.transaction_type == TransactionType.credit,
        )
        .scalar()
    )
    return float(result or 0.0)


# ---------------------------------------------------------------------------
# Products / Categories
# ---------------------------------------------------------------------------

def get_all_categories_with_products(db: Session) -> list[Category]:
    return (
        db.query(Category)
        .options(joinedload(Category.products))
        .order_by(Category.display_order)
        .all()
    )


def get_product_by_id(db: Session, product_id: int) -> Optional[Product]:
    return db.query(Product).filter(Product.id == product_id).first()


def get_products_by_ids(db: Session, product_ids: list[int]) -> list[Product]:
    return db.query(Product).filter(Product.id.in_(product_ids)).all()


# ---------------------------------------------------------------------------
# Orders
# ---------------------------------------------------------------------------

def generate_order_number(db: Session) -> str:
    count = db.query(func.count(Order.id)).scalar() or 0
    number = settings.ORDER_START + count
    return f"{settings.ORDER_PREFIX}-{number}"


def create_order(
    db: Session,
    user_id: int,
    order_number: str,
    subtotal: float,
    wallet_used: float,
    final_amount: float,
    items_data: list[dict],
) -> Order:
    order = Order(
        order_number=order_number,
        user_id=user_id,
        subtotal=subtotal,
        wallet_used=wallet_used,
        final_amount=final_amount,
        status=OrderStatus.pending,
        buyer_reward=0.0,
        referrer_reward=0.0,
    )
    db.add(order)
    db.flush()  # get order.id before committing

    for item_data in items_data:
        item = OrderItem(
            order_id=order.id,
            product_id=item_data["product_id"],
            product_name=item_data["product_name"],
            unit_price=item_data["unit_price"],
            quantity=item_data["quantity"],
            line_total=item_data["line_total"],
        )
        db.add(item)

    db.commit()
    db.refresh(order)
    return order


def get_order_by_id(db: Session, order_id: int) -> Optional[Order]:
    return (
        db.query(Order)
        .options(joinedload(Order.items), joinedload(Order.user))
        .filter(Order.id == order_id)
        .first()
    )


def get_order_by_number(db: Session, order_number: str) -> Optional[Order]:
    return (
        db.query(Order)
        .options(joinedload(Order.items), joinedload(Order.user))
        .filter(Order.order_number == order_number)
        .first()
    )


def get_orders_by_user(db: Session, user_id: int) -> list[Order]:
    return (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.user_id == user_id)
        .order_by(desc(Order.created_at))
        .all()
    )


def get_pending_orders(db: Session) -> list[Order]:
    return (
        db.query(Order)
        .options(joinedload(Order.items), joinedload(Order.user))
        .filter(Order.status == OrderStatus.pending)
        .order_by(Order.created_at)
        .all()
    )


def get_all_orders(db: Session) -> list[Order]:
    return (
        db.query(Order)
        .options(joinedload(Order.items), joinedload(Order.user))
        .order_by(desc(Order.created_at))
        .all()
    )


def update_order_status(
    db: Session,
    order: Order,
    status: OrderStatus,
    approved_amount: Optional[float] = None,
    buyer_reward: float = 0.0,
    referrer_reward: float = 0.0,
) -> Order:
    order.status = status
    if approved_amount is not None:
        order.approved_amount = approved_amount
    order.buyer_reward = buyer_reward
    order.referrer_reward = referrer_reward
    db.commit()
    db.refresh(order)
    return order


# ---------------------------------------------------------------------------
# Wallet
# ---------------------------------------------------------------------------

def get_wallet_transactions(db: Session, user_id: int) -> list[WalletTransaction]:
    return (
        db.query(WalletTransaction)
        .filter(WalletTransaction.user_id == user_id)
        .order_by(desc(WalletTransaction.created_at))
        .all()
    )


def create_wallet_transaction(
    db: Session,
    user_id: int,
    transaction_type: TransactionType,
    reason: TransactionReason,
    amount: float,
    balance_after: float,
    order_id: Optional[int] = None,
    note: Optional[str] = None,
) -> WalletTransaction:
    txn = WalletTransaction(
        user_id=user_id,
        order_id=order_id,
        transaction_type=transaction_type,
        reason=reason,
        amount=amount,
        balance_after=balance_after,
        note=note,
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return txn


def update_user_wallet(db: Session, user: User, new_balance: float) -> User:
    user.wallet_balance = round(new_balance, 2)
    db.commit()
    db.refresh(user)
    return user


# ---------------------------------------------------------------------------
# Dashboard Stats
# ---------------------------------------------------------------------------

def get_dashboard_stats(db: Session) -> dict:
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_orders = db.query(func.count(Order.id)).scalar() or 0

    revenue_result = (
        db.query(func.sum(Order.approved_amount))
        .filter(Order.status == OrderStatus.approved)
        .scalar()
    )
    total_revenue = float(revenue_result or 0.0)

    rewards_result = (
        db.query(func.sum(WalletTransaction.amount))
        .filter(WalletTransaction.transaction_type == TransactionType.credit)
        .scalar()
    )
    total_rewards = float(rewards_result or 0.0)

    pending = (
        db.query(func.count(Order.id))
        .filter(Order.status == OrderStatus.pending)
        .scalar() or 0
    )
    approved = (
        db.query(func.count(Order.id))
        .filter(Order.status == OrderStatus.approved)
        .scalar() or 0
    )
    rejected = (
        db.query(func.count(Order.id))
        .filter(Order.status == OrderStatus.rejected)
        .scalar() or 0
    )

    return {
        "total_users": total_users,
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "total_rewards_distributed": total_rewards,
        "pending_orders": pending,
        "approved_orders": approved,
        "rejected_orders": rejected,
    }
