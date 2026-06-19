from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from schemas import PlaceOrderRequest, OrderResponse, OrderListItem
from models import User
from auth import get_current_user
import crud
import services

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def place_order(
    payload: PlaceOrderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        order = services.place_order(db, current_user, payload)
    except services.CartValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    return _order_to_response(order)


@router.get("/", response_model=list[OrderListItem])
def list_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    orders = crud.get_orders_by_user(db, current_user.id)
    result = []
    for order in orders:
        result.append(
            OrderListItem(
                id=order.id,
                order_number=order.order_number,
                status=order.status,
                subtotal=order.subtotal,
                wallet_used=order.wallet_used,
                final_amount=order.final_amount,
                approved_amount=order.approved_amount,
                buyer_reward=order.buyer_reward,
                referrer_reward=order.referrer_reward,
                item_count=sum(i.quantity for i in order.items),
                created_at=order.created_at,
            )
        )
    return result


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = crud.get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")
    if order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    return _order_to_response(order)


def _order_to_response(order) -> OrderResponse:
    from schemas import OrderItemResponse
    return OrderResponse(
        id=order.id,
        order_number=order.order_number,
        status=order.status,
        subtotal=order.subtotal,
        wallet_used=order.wallet_used,
        final_amount=order.final_amount,
        approved_amount=order.approved_amount,
        buyer_reward=order.buyer_reward,
        referrer_reward=order.referrer_reward,
        items=[
            OrderItemResponse(
                id=item.id,
                product_id=item.product_id,
                product_name=item.product_name,
                unit_price=item.unit_price,
                quantity=item.quantity,
                line_total=item.line_total,
            )
            for item in order.items
        ],
        created_at=order.created_at,
    )
