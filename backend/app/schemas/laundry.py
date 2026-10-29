from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from backend.app.models.laundry import LaundryOrderStatus, LaundryServiceType

class LaundryItemInput(BaseModel):
    item_category: str # SHIRT, TROUSER, BEDSHEET, TOWEL, JACKET
    quantity: int = Field(..., gt=0)

class LaundryOrderCreate(BaseModel):
    student_id: str
    student_name: str
    room_number: Optional[str] = None
    block_name: Optional[str] = None
    service_type: LaundryServiceType = LaundryServiceType.WASH_AND_IRON
    pickup_date: str # YYYY-MM-DD
    pickup_time_slot: str # e.g. "09:00 - 11:00 AM"
    items: List[LaundryItemInput]
    special_instructions: Optional[str] = None
    bill_to_fees: bool = False # Integration toggle with existing Fee Management module

class LaundryCountConfirmation(BaseModel):
    confirmed_counts: List[LaundryItemInput]
    staff_id: str
    staff_name: str
    notes: Optional[str] = None

class LaundryStatusUpdate(BaseModel):
    status: LaundryOrderStatus
    actor_id: str
    actor_name: str
    notes: Optional[str] = None

class LaundryOrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    item_category: str
    quantity_submitted: int
    quantity_confirmed: Optional[int] = None
    unit_rate: float
    total_price: float

class LaundryStatusEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    status: str
    actor_id: str
    actor_role: str
    timestamp: datetime
    notes: Optional[str] = None

class LaundryOrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    order_ref: str
    student_id: str
    student_name: str
    room_number: Optional[str] = None
    block_name: Optional[str] = None
    service_type: LaundryServiceType
    pickup_date: str
    pickup_time_slot: str
    submitted_item_count: int
    confirmed_item_count: Optional[int] = None
    count_mismatch_noted: str
    estimated_amount: float
    final_amount: float
    billing_status: str
    fee_transaction_id: Optional[str] = None
    status: LaundryOrderStatus
    status_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: List[LaundryOrderItemResponse] = []
    events: List[LaundryStatusEventResponse] = []

class LaundryRateCreate(BaseModel):
    item_category: str
    service_type: Optional[LaundryServiceType] = LaundryServiceType.WASH_AND_IRON
    rate_per_piece: float

class LaundryRateUpdate(BaseModel):
    rate_per_piece: float
    service_type: Optional[LaundryServiceType] = None
    is_active: Optional[str] = None

class LaundryRateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    item_category: str
    service_type: LaundryServiceType
    rate_per_piece: float
    is_active: str

class LaundryStats(BaseModel):
    today_pickups: int
    in_processing: int
    ready_for_delivery: int
    completed_orders: int
    total_revenue: float
