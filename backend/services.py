from sqlalchemy.orm import Session
from typing import Optional
from models import (
    User, Order, Product, OrderStatus,
    TransactionType, TransactionReason
)
from schemas import CartItem, PlaceOrderRequest
import crud
from settings import settings


# ---------------------------------------------------------------------------
# Cart validation & order creation
# ---------------------------------------------------------------------------

class CartValidationError(Exception):
    pass


def validate_and_build_cart(
    db: Session,
    cart_items: list[CartItem],
) -> tuple[list[dict], float]:
    """
    Validates cart items against DB products.
    Returns (items_data, subtotal).
    Raises CartValidationError on any issue.
    """
    if not cart_items:
        raise CartValidationError("Cart is empty")

    product_ids = [item.product_id for item in cart_items]
    products_map: dict[int, Product] = {
        p.id: p for p in crud.get_products_by_ids(db, product_ids)
    }

    items_data = []
    subtotal = 0.0

    for cart_item in cart_items:
        product = products_map.get(cart_item.product_id)
        if not product:
            raise CartValidationError(f"Product ID {cart_item.product_id} not found")
        if not product.is_available:
            raise CartValidationError(f"'{product.name}' is currently unavailable")

        line_total = round(product.price * cart_item.quantity, 2)
        subtotal += line_total

        items_data.append({
            "product_id": product.id,
            "product_name": product.name,
            "unit_price": product.price,
            "quantity": cart_item.quantity,
            "line_total": line_total,
        })

    return items_data, round(subtotal, 2)


def place_order(
    db: Session,
    user: User,
    request: PlaceOrderRequest,
) -> Order:
    """
    Full order placement flow:
    1. Validate cart
    2. Calculate wallet deduction (if requested)
    3. Create order + items
    4. Deduct wallet balance if used
    """
    items_data, subtotal = validate_and_build_cart(db, request.items)

    wallet_used = 0.0
    final_amount = subtotal

    if request.use_wallet and user.wallet_balance > 0:
        wallet_used = min(user.wallet_balance, subtotal)
        wallet_used = round(wallet_used, 2)
        final_amount = round(subtotal - wallet_used, 2)

    order_number = crud.generate_order_number(db)

    order = crud.create_order(
        db=db,
        user_id=user.id,
        order_number=order_number,
        subtotal=subtotal,
        wallet_used=wallet_used,
        final_amount=final_amount,
        items_data=items_data,
    )

    # Deduct wallet immediately if used
    if wallet_used > 0:
        new_balance = round(user.wallet_balance - wallet_used, 2)
        crud.update_user_wallet(db, user, new_balance)
        crud.create_wallet_transaction(
            db=db,
            user_id=user.id,
            order_id=order.id,
            transaction_type=TransactionType.debit,
            reason=TransactionReason.order_redemption,
            amount=wallet_used,
            balance_after=new_balance,
            note=f"Wallet redeemed for order {order_number}",
        )

    return order


# ---------------------------------------------------------------------------
# Reward distribution (called on order approval)
# ---------------------------------------------------------------------------

def _calculate_rewards(amount: float) -> tuple[float, float]:
    """
    Returns (buyer_reward, referrer_reward) based on settings ratios.
    """
    pool = round(amount * settings.REWARD_PERCENTAGE, 2)
    buyer = round(pool * settings.BUYER_REWARD_RATIO, 2)
    referrer = round(pool - buyer, 2)
    return buyer, referrer


def distribute_rewards(db: Session, order: Order) -> None:
    """
    Called when owner approves an order.
    Uses approved_amount if set, else final_amount.
    Credits buyer and referrer wallets.
    """
    base_amount = order.approved_amount if order.approved_amount else order.final_amount
    buyer_reward, referrer_reward = _calculate_rewards(base_amount)

    user: User = crud.get_user_by_id(db, order.user_id)

    # --- Credit buyer ---
    new_buyer_balance = round(user.wallet_balance + buyer_reward, 2)
    crud.update_user_wallet(db, user, new_buyer_balance)
    crud.create_wallet_transaction(
        db=db,
        user_id=user.id,
        order_id=order.id,
        transaction_type=TransactionType.credit,
        reason=TransactionReason.referral_buyer,
        amount=buyer_reward,
        balance_after=new_buyer_balance,
        note=f"Reward for order {order.order_number}",
    )

    # --- Credit referrer (if any) ---
    actual_referrer_reward = 0.0
    if user.referred_by_user_id:
        referrer: User = crud.get_user_by_id(db, user.referred_by_user_id)
        if referrer and referrer.is_active:
            new_referrer_balance = round(referrer.wallet_balance + referrer_reward, 2)
            crud.update_user_wallet(db, referrer, new_referrer_balance)
            crud.create_wallet_transaction(
                db=db,
                user_id=referrer.id,
                order_id=order.id,
                transaction_type=TransactionType.credit,
                reason=TransactionReason.referral_referrer,
                amount=referrer_reward,
                balance_after=new_referrer_balance,
                note=f"Referral reward from {user.full_name}'s order {order.order_number}",
            )
            actual_referrer_reward = referrer_reward
    else:
        # No referrer — buyer gets the full pool
        extra = referrer_reward
        new_buyer_balance2 = round(user.wallet_balance + extra, 2)
        crud.update_user_wallet(db, user, new_buyer_balance2)
        crud.create_wallet_transaction(
            db=db,
            user_id=user.id,
            order_id=order.id,
            transaction_type=TransactionType.credit,
            reason=TransactionReason.referral_buyer,
            amount=extra,
            balance_after=new_buyer_balance2,
            note=f"Full reward (no referrer) for order {order.order_number}",
        )
        buyer_reward = round(buyer_reward + extra, 2)

    # Update order reward fields
    crud.update_order_status(
        db=db,
        order=order,
        status=OrderStatus.approved,
        approved_amount=order.approved_amount or order.final_amount,
        buyer_reward=buyer_reward,
        referrer_reward=actual_referrer_reward,
    )


# ---------------------------------------------------------------------------
# Order approval / rejection
# ---------------------------------------------------------------------------

def approve_order(
    db: Session,
    order: Order,
    final_amount_override: Optional[float] = None,
) -> Order:
    """
    Owner approves an order.
    Optionally overrides the final payable amount.
    Distributes wallet rewards after approval.
    """
    if order.status != OrderStatus.pending:
        raise ValueError(f"Order {order.order_number} is not pending")

    if final_amount_override is not None:
        order.approved_amount = round(final_amount_override, 2)
    else:
        order.approved_amount = order.final_amount

    db.commit()

    distribute_rewards(db, order)

    db.refresh(order)
    return order


def reject_order(db: Session, order: Order) -> Order:
    """
    Owner rejects an order.
    Refunds any wallet amount that was deducted.
    """
    if order.status != OrderStatus.pending:
        raise ValueError(f"Order {order.order_number} is not pending")

    # Refund wallet if deducted
    if order.wallet_used > 0:
        user: User = crud.get_user_by_id(db, order.user_id)
        new_balance = round(user.wallet_balance + order.wallet_used, 2)
        crud.update_user_wallet(db, user, new_balance)
        crud.create_wallet_transaction(
            db=db,
            user_id=user.id,
            order_id=order.id,
            transaction_type=TransactionType.credit,
            reason=TransactionReason.manual_credit,
            amount=order.wallet_used,
            balance_after=new_balance,
            note=f"Wallet refunded — order {order.order_number} rejected",
        )

    crud.update_order_status(
        db=db,
        order=order,
        status=OrderStatus.rejected,
    )

    db.refresh(order)
    return order
