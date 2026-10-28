import enum
from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, String, DateTime, Text, Enum, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.db.session import Base

class VisitorStatus(str, enum.Enum):
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"
    CHECKED_IN = "CHECKED_IN"
    CHECKED_OUT = "CHECKED_OUT"
    EXPIRED = "EXPIRED"

class VisitorCategory(str, enum.Enum):
    PARENT = "PARENT"
    FAMILY = "FAMILY"
    FRIEND = "FRIEND"
    DELIVERY_OFFICIAL = "DELIVERY_OFFICIAL"
    VENDOR_CONTRACTOR = "VENDOR_CONTRACTOR"
    OTHER = "OTHER"

class Visitor(Base):
    __tablename__ = "visitors"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False, index=True)
    phone = Column(String(20), nullable=False, index=True)
    email = Column(String(120), nullable=True)
    id_proof_type = Column(String(50), nullable=True)
    id_proof_number = Column(String(50), nullable=True)
    category = Column(Enum(VisitorCategory), default=VisitorCategory.PARENT, nullable=False)
    
    # Host Student
    host_student_id = Column(String(50), nullable=False, index=True)
    host_student_name = Column(String(100), nullable=False)
    host_student_room = Column(String(50), nullable=True)
    host_student_block = Column(String(50), nullable=True)
    
    purpose = Column(String(255), nullable=False)
    expected_arrival = Column(DateTime, nullable=False)
    expected_departure = Column(DateTime, nullable=False)
    status = Column(Enum(VisitorStatus), default=VisitorStatus.PENDING_APPROVAL, nullable=False, index=True)
    notes = Column(Text, nullable=True)

    # Approvals & review
    reviewed_by = Column(String(100), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    passes = relationship("VisitorPass", back_populates="visitor", cascade="all, delete-orphan")
    events = relationship("VisitorEvent", back_populates="visitor", cascade="all, delete-orphan")

class VisitorPass(Base):
    __tablename__ = "visitor_passes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    visitor_id = Column(String, ForeignKey("visitors.id"), nullable=False, index=True)
    pass_code = Column(String(64), unique=True, nullable=False, index=True) # Unpredictable secure token
    valid_from = Column(DateTime, nullable=False)
    valid_until = Column(DateTime, nullable=False)
    is_revoked = Column(String(10), default="FALSE", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    visitor = relationship("Visitor", back_populates="passes")

class VisitorEvent(Base):
    __tablename__ = "visitor_events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    visitor_id = Column(String, ForeignKey("visitors.id"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False) # CREATED, APPROVED, REJECTED, CHECKED_IN, CHECKED_OUT, REVOKED
    actor_id = Column(String(100), nullable=False)
    actor_role = Column(String(50), nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    details = Column(Text, nullable=True)

    visitor = relationship("Visitor", back_populates="events")
