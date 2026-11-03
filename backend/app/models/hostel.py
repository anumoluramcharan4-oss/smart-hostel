"""Hostel, Room, Student, and Allocation models"""
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    Numeric,
    Boolean,
    DateTime,
    ForeignKey,
    JSON,
    Index,
    text,
)
from backend.app.db.session import Base


class Block(Base):
    __tablename__ = "blocks"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    code = Column(String, nullable=True)
    floors_count = Column(Integer, nullable=False)
    rooms_count = Column(Integer, default=0)
    capacity = Column(Integer, default=0)
    occupied = Column(Integer, default=0)
    warden_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Room(Base):
    __tablename__ = "rooms"

    id = Column(String, primary_key=True)
    number = Column(String, nullable=False, index=True)
    block_id = Column(String, ForeignKey("blocks.id", ondelete="SET NULL"), nullable=True)
    block_name = Column(String, nullable=True)
    floor = Column(Integer, nullable=False, index=True)
    type = Column(String, nullable=False)
    capacity = Column(Integer, nullable=False)
    occupied = Column(Integer, default=0)
    status = Column(String, default="available")  # 'available' | 'occupied' | 'maintenance'
    amenities = Column(JSON, default=list)
    occupants = Column(JSON, default=list)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(String, primary_key=True)
    full_name = Column(String, nullable=False, index=True)
    email = Column(String, unique=True, nullable=True)
    phone = Column(String, nullable=True)
    role = Column(String, default="student", index=True)  # 'student' | 'warden' | 'admin'
    avatar_url = Column(String, nullable=True)
    room_number = Column(String, nullable=True, index=True)
    block_name = Column(String, nullable=True)
    bed_number = Column(String, nullable=True)
    roll_no = Column(String, unique=True, nullable=True, index=True)
    course = Column(String, nullable=True)
    year = Column(Integer, default=1)
    guardian_name = Column(String, nullable=True)
    guardian_phone = Column(String, nullable=True)
    fee_status = Column(String, default="paid")  # 'paid' | 'pending' | 'partial'
    fee_amount_due = Column(Numeric, default=0)
    attendance_percent = Column(Numeric, default=95)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Allocation(Base):
    __tablename__ = "allocations"

    id = Column(String, primary_key=True)
    student_id = Column(String, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    room_id = Column(String, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    room_number = Column(String, nullable=False)
    bed_number = Column(String, nullable=False)
    is_active = Column(Boolean, default=True, index=True)
    allocated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    deallocated_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index(
            "idx_allocations_active_student",
            "student_id",
            unique=True,
            sqlite_where=text("is_active = 1"),
            postgresql_where=text("is_active = TRUE"),
        ),
        Index(
            "idx_allocations_active_bed",
            "room_number",
            "bed_number",
            unique=True,
            sqlite_where=text("is_active = 1"),
            postgresql_where=text("is_active = TRUE"),
        ),
    )


class AllocationHistory(Base):
    __tablename__ = "allocation_history"

    id = Column(String, primary_key=True)
    student_id = Column(String, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    student_name = Column(String, nullable=False)
    student_roll = Column(String, nullable=True)
    room_number = Column(String, nullable=False)
    bed_number = Column(String, nullable=False)
    action = Column(String, nullable=False)  # 'allocate' | 'deallocate' | 'transfer'
    performed_by = Column(String, default="admin")
    reason = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    category = Column(String, nullable=False)
    priority = Column(String, default="medium")
    status = Column(String, default="pending")
    student_id = Column(String, ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True)
    student_name = Column(String, nullable=True)
    room_number = Column(String, nullable=True)
    block_name = Column(String, nullable=True)
    assigned_to = Column(String, nullable=True)
    resolution_notes = Column(String, nullable=True)
    timeline = Column(JSON, default=list)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class FeeRecord(Base):
    __tablename__ = "fees"

    id = Column(String, primary_key=True)
    student_id = Column(String, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    student_name = Column(String, nullable=False)
    roll_no = Column(String, nullable=True)
    room_number = Column(String, nullable=True)
    term = Column(String, default="Term 1, Autumn 2026-2027")
    total_amount = Column(Numeric, nullable=False, default=45000)
    paid_amount = Column(Numeric, nullable=False, default=45000)
    pending_amount = Column(Numeric, nullable=False, default=0)
    status = Column(String, default="paid")  # 'paid' | 'pending' | 'partial'
    due_date = Column(String, default="2026-11-30")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class PaymentTransaction(Base):
    __tablename__ = "payments"

    id = Column(String, primary_key=True)
    fee_id = Column(String, ForeignKey("fees.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String, nullable=False)
    amount = Column(Numeric, nullable=False)
    payment_method = Column(String, default="UPI")
    transaction_ref = Column(String, unique=True, nullable=False)
    paid_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Notice(Base):
    __tablename__ = "notices"

    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    category = Column(String, default="general")
    priority = Column(String, default="normal")
    author = Column(String, default="Hostel Administration")
    target_audience = Column(String, default="all")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime, nullable=True)


class Staff(Base):
    __tablename__ = "staff"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    phone = Column(String, unique=True, nullable=False)
    trade = Column(String, nullable=False, index=True)
    status = Column(String, default="active", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Warden(Base):
    __tablename__ = "wardens"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    assigned_block_id = Column(String, default="blk-a")
    assigned_block_name = Column(String, default="Block A (Newton)")
    designation = Column(String, default="Senior Resident Warden")
    status = Column(String, default="on_duty")
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class WardenGrievance(Base):
    __tablename__ = "warden_grievances"

    id = Column(String, primary_key=True)
    student_id = Column(String, nullable=True)
    student_name = Column(String, nullable=False, default="Anonymous Student")
    student_email = Column(String, nullable=True)
    student_phone = Column(String, nullable=True)
    room_number = Column(String, nullable=True)
    block_name = Column(String, nullable=True)
    warden_name = Column(String, nullable=True)
    warden_id = Column(String, nullable=True)
    category = Column(String, default="other")
    subject = Column(String, nullable=False)
    description = Column(String, nullable=False)
    status = Column(String, default="under_review")  # 'under_review' | 'resolved' | 'dismissed'
    admin_notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


