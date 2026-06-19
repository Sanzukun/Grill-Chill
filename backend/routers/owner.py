from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from schemas import (
    DashboardStats, OwnerOrderResponse, OwnerOrderItemResponse,
    ApproveOrderRequest, MessageResponse
)
from auth import require_owner
import crud
import services
from models import OrderStatus

router = APIRouter(prefix="/owner", tags=["Owner Dashboard"])


def _build_owner_order(order) -> OwnerOrderResponse:
    return OwnerOrderResponse(
        id=order.id,
        order_number=order.order_number,
        status=order.status,
        subtotal=order.subtotal,
        wallet_used=order.wallet_used,
        final_amount=order.final_amount,
        approved_amount=order.approved_amount,
        buyer_reward=order.buyer_reward,
        referrer_reward=order.referrer_reward,
        customer_name=order.user.full_name,
        customer_phone=order.user.phone,
        items=[
            OwnerOrderItemResponse(
                product_name=item.product_name,
                quantity=item.quantity,
                unit_price=item.unit_price,
                line_total=item.line_total,
            )
            for item in order.items
        ],
        created_at=order.created_at,
    )


@router.get("/stats", response_model=DashboardStats)
def get_stats(
    db: Session = Depends(get_db),
    _: None = Depends(require_owner),
):
    stats = crud.get_dashboard_stats(db)
    return DashboardStats(**stats)


@router.get("/orders/pending", response_model=list[OwnerOrderResponse])
def get_pending_orders(
    db: Session = Depends(get_db),
    _: None = Depends(require_owner),
):
    orders = crud.get_pending_orders(db)
    return [_build_owner_order(o) for o in orders]


@router.get("/orders", response_model=list[OwnerOrderResponse])
def get_all_orders(
    db: Session = Depends(get_db),
    _: None = Depends(require_owner),
):
    orders = crud.get_all_orders(db)
    return [_build_owner_order(o) for o in orders]


@router.post("/orders/{order_id}/approve", response_model=OwnerOrderResponse)
def approve_order(
    order_id: int,
    payload: ApproveOrderRequest,
    db: Session = Depends(get_db),
    _: None = Depends(require_owner),
):
    order = crud.get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    try:
        order = services.approve_order(
            db=db,
            order=order,
            final_amount_override=payload.final_amount,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    return _build_owner_order(order)


@router.post("/orders/{order_id}/reject", response_model=OwnerOrderResponse)
def reject_order(
    order_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(require_owner),
):
    order = crud.get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    try:
        order = services.reject_order(db=db, order=order)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    return _build_owner_order(order)
