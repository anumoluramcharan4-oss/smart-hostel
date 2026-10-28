import enum
from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, String, Integer, DateTime, Text, Enum, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.db.session import Base

class ParcelStatus(str, enum.Enum):
    RECEIVED = "RECEIVED"
    AWAITING_COLLECTION = "AWAITING_COLLECTION"
    COLLECTED = "COLLECTED"
    RETURNED = "RETURNED"
    DAMAGED = "DAMAGED"
    MISSING = "MISSING"
    CANCELLED = "CANCELLED"

class Parcel(Base):
    __tablename__ = "parcels"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    parcel_ref = Column(String(50), unique=True, nullable=False, index=True) # e.g. PCL-2026-9041
    
    # Recipient Student
    recipient_student_id = Column(String(50), nullable=False, index=True)
    recipient_name = Column(String(100), nullable=False)
    recipient_room = Column(String(50), nullable=True)
    recipient_block = Column(String(50), nullable=True)

    courier = Column(String(100), nullable=False) # e.g. Amazon, Bluedart, FedEx, DTDC
    tracking_number = Column(String(100), nullable=True) # Optional carrier tracking
    storage_location = Column(String(50), nullable=False) # Shelf A-3, Locker 12
    locker_number = Column(String(20), nullable=True, index=True)
    
    received_by = Column(String(100), nullable=False) # Staff who registered parcel
    status = Column(Enum(ParcelStatus), default=ParcelStatus.AWAITING_COLLECTION, nullable=False, index=True)
    notes = Column(Text, nullable=True)

    # Handover details upon collection
    collected_at = Column(DateTime, nullable=True)
    handed_over_by = Column(String(100), nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    pickup_codes = relationship("ParcelPickupCode", back_populates="parcel", cascade="all, delete-orphan")
    events = relationship("ParcelEvent", back_populates="parcel", cascade="all, delete-orphan")

class ParcelPickupCode(Base):
    __tablename__ = "parcel_pickup_codes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    parcel_id = Column(String, ForeignKey("parcels.id"), nullable=False, index=True)
    code = Column(String(32), nullable=False, index=True) # Cryptographic 6-digit OTP or opaque hash
    valid_until = Column(DateTime, nullable=False)
    used = Column(String(10), default="FALSE", nullable=False)
    attempts = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    parcel = relationship("Parcel", back_populates="pickup_codes")

class ParcelEvent(Base):
    __tablename__ = "parcel_events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    parcel_id = Column(String, ForeignKey("parcels.id"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False) # REGISTERED, CODE_GENERATED, VERIFIED, COLLECTED, RETURNED, DAMAGED
    actor_id = Column(String(100), nullable=False)
    actor_role = Column(String(50), nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    details = Column(Text, nullable=True)

    parcel = relationship("Parcel", back_populates="events")
