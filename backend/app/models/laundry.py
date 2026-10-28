import enum
from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, Enum, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.db.session import Base

class LaundryOrderStatus(str, enum.Enum):
    REQUESTED = "REQUESTED"
    SCHEDULED = "SCHEDULED"
    COLLECTED = "COLLECTED"
    PROCESSING = "PROCESSING"
    READY_FOR_COLLECTION = "READY_FOR_COLLECTION"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"

class LaundryServiceType(str, enum.Enum):
    WASH_AND_FOLD = "WASH_AND_FOLD"
    WASH_AND_IRON = "WASH_AND_IRON"
    DRY_CLEAN = "DRY_CLEAN"
    IRONING_ONLY = "IRONING_ONLY"

class LaundryRate(Base):
    __tablename__ = "laundry_rates"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    item_category = Column(String(50), nullable=False) # e.g. "SHIRT", "TROUSER", "BEDSHEET", "TOWEL", "JACKET"
    service_type = Column(Enum(LaundryServiceType), default=LaundryServiceType.WASH_AND_IRON, nullable=False)
    rate_per_piece = Column(Float, nullable=False)
    is_active = Column(String(10), default="TRUE", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class LaundrySlot(Base):
    __tablename__ = "laundry_slots"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    slot_date = Column(String(20), nullable=False, index=True) # YYYY-MM-DD
    time_window = Column(String(50), nullable=False) # "09:00 - 11:00 AM", "04:00 - 06:00 PM"
    max_capacity = Column(Integer, default=15, nullable=False)
    booked_count = Column(Integer, default=0, nullable=False)
    is_open = Column(String(10), default="TRUE", nullable=False)

class LaundryOrder(Base):
    __tablename__ = "laundry_orders"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_ref = Column(String(50), unique=True, nullable=False, index=True) # LND-2026-XXXX
    
    # Student Resident
    student_id = Column(String(50), nullable=False, index=True)
    student_name = Column(String(100), nullable=False)
    room_number = Column(String(50), nullable=True)
    block_name = Column(String(50), nullable=True)

    service_type = Column(Enum(LaundryServiceType), default=LaundryServiceType.WASH_AND_IRON, nullable=False)
    slot_id = Column(String, ForeignKey("laundry_slots.id"), nullable=True)
    pickup_date = Column(String(20), nullable=False)
    pickup_time_slot = Column(String(50), nullable=False)
    special_instructions = Column(Text, nullable=True)

    # Counts
    submitted_item_count = Column(Integer, nullable=False, default=0)
    confirmed_item_count = Column(Integer, nullable=True) # Actual count verified by laundry staff
    count_mismatch_noted = Column(String(10), default="FALSE", nullable=False)

    # Billing & Financials (Server-Side Computed)
    estimated_amount = Column(Float, default=0.0, nullable=False)
    final_amount = Column(Float, default=0.0, nullable=False)
    billing_status = Column(String(50), default="PENDING", nullable=False) # PENDING, BILLED_TO_FEES, PAID_DIRECT, COMPLIMENTARY
    fee_transaction_id = Column(String(100), nullable=True) # Link to existing Fee Management module

    status = Column(Enum(LaundryOrderStatus), default=LaundryOrderStatus.REQUESTED, nullable=False, index=True)
    status_notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    items = relationship("LaundryOrderItem", back_populates="order", cascade="all, delete-orphan")
    events = relationship("LaundryStatusEvent", back_populates="order", cascade="all, delete-orphan")

class LaundryOrderItem(Base):
    __tablename__ = "laundry_order_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String, ForeignKey("laundry_orders.id"), nullable=False, index=True)
    item_category = Column(String(50), nullable=False) # SHIRT, TROUSER, etc.
    quantity_submitted = Column(Integer, nullable=False)
    quantity_confirmed = Column(Integer, nullable=True)
    unit_rate = Column(Float, default=0.0, nullable=False)
    total_price = Column(Float, default=0.0, nullable=False)

    order = relationship("LaundryOrder", back_populates="items")

class LaundryStatusEvent(Base):
    __tablename__ = "laundry_status_events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String, ForeignKey("laundry_orders.id"), nullable=False, index=True)
    status = Column(String(50), nullable=False)
    actor_id = Column(String(100), nullable=False)
    actor_role = Column(String(50), nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    notes = Column(Text, nullable=True)

    order = relationship("LaundryOrder", back_populates="events")
