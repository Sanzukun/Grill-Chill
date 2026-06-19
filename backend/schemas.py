from pydantic import BaseModel, field_validator, model_validator
from typing import Optional, List
from datetime import datetime
from models import OrderStatus, TransactionType, TransactionReason
import re


# ---------------------------------------------------------------------------
# Auth / Users
# ---------------------------------------------------------------------------

class RegisterRequest(BaseModel):
    full_name: str
    phone: str
    password: str
    referral_code: Optional[str] = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r"^[6-9]\d{9}$", v):
            raise ValueError("Enter a valid 10-digit Indian mobile number")
        return v

    @field_validator("full_name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Name must be at least 2 characters")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class LoginRequest(BaseModel):
    phone: str
    password: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return v.strip()


class OwnerLoginRequest(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    full_name: str
    phone: str
    referral_code: str
    wallet_balance: float
    created_at: datetime

    model_config = {"from_attributes": True}


class ProfileResponse(BaseModel):
    id: int
    full_name: str
    phone: str
    referral_code: str
    wallet_balance: float
    total_orders: int
    total_referrals: int
    lifetime_earnings: float
    created_at: datetime

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    token: str
    user: UserResponse


class OwnerAuthResponse(BaseModel):
    token: str
    message: str


# ---------------------------------------------------------------------------
# Products
# ---------------------------------------------------------------------------

class ProductResponse(BaseModel):
    id: int
    name: str
    price: float
    is_available: bool
    category_id: int

    model_config = {"from_attributes": True}


class CategoryWithProducts(BaseModel):
    id: int
    name: str
    display_order: int
    products: List[ProductResponse]

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Orders
# ---------------------------------------------------------------------------

class CartItem(BaseModel):
    product_id: int
    quantity: int

    @field_validator("quantity")
    @classmethod
    def validate_qty(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Quantity must be at least 1")
        return v


class PlaceOrderRequest(BaseModel):
    items: List[CartItem]
    use_wallet: bool = False

    @field_validator("items")
    @classmethod
    def validate_items(cls, v: List[CartItem]) -> List[CartItem]:
        if not v:
            raise ValueError("Cart cannot be empty")
        return v


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    unit_price: float
    quantity: int
    line_total: float

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    id: int
    order_number: str
    status: OrderStatus
    subtotal: float
    wallet_used: float
    final_amount: float
    approved_amount: Optional[float]
    buyer_reward: float
    referrer_reward: float
    items: List[OrderItemResponse]
    created_at: datetime

    model_config = {"from_attributes": True}


class OrderListItem(BaseModel):
    id: int
    order_number: str
    status: OrderStatus
    subtotal: float
    wallet_used: float
    final_amount: float
    approved_amount: Optional[float]
    buyer_reward: float
    referrer_reward: float
    item_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Wallet
# ---------------------------------------------------------------------------

class WalletTransactionResponse(BaseModel):
    id: int
    order_id: Optional[int]
    transaction_type: TransactionType
    reason: TransactionReason
    amount: float
    balance_after: float
    note: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class WalletResponse(BaseModel):
    balance: float
    transactions: List[WalletTransactionResponse]


# ---------------------------------------------------------------------------
# Owner Dashboard
# ---------------------------------------------------------------------------

class OwnerOrderItemResponse(BaseModel):
    product_name: str
    quantity: int
    unit_price: float
    line_total: float

    model_config = {"from_attributes": True}


class OwnerOrderResponse(BaseModel):
    id: int
    order_number: str
    status: OrderStatus
    subtotal: float
    wallet_used: float
    final_amount: float
    approved_amount: Optional[float]
    buyer_reward: float
    referrer_reward: float
    customer_name: str
    customer_phone: str
    items: List[OwnerOrderItemResponse]
    created_at: datetime

    model_config = {"from_attributes": True}


class ApproveOrderRequest(BaseModel):
    final_amount: Optional[float] = None

    @field_validator("final_amount")
    @classmethod
    def validate_amount(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v <= 0:
            raise ValueError("Amount must be positive")
        return v


class DashboardStats(BaseModel):
    total_users: int
    total_orders: int
    total_revenue: float
    total_rewards_distributed: float
    pending_orders: int
    approved_orders: int
    rejected_orders: int


# ---------------------------------------------------------------------------
# Generic
# ---------------------------------------------------------------------------

class MessageResponse(BaseModel):
    message: str


class ErrorResponse(BaseModel):
    detail: str
