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
    floors_count = Column(Integer, default=5)
    rooms_count = Column(Integer, default=30)
    capacity = Column(Integer, default=120)
    occupied = Column(Integer, default=120)
    warden_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Room(Base):
    __tablename__ = "rooms"

    id = Column(String, primary_key=True)
    number = Column(String, nullable=False, index=True)
    block_id = Column(String, ForeignKey("blocks.id", ondelete="SET NULL"), nullable=True)
    block_name = Column(String, default="Block A (Newton)")
    floor = Column(Integer, default=1, index=True)
    type = Column(String, default="quad")
    capacity = Column(Integer, default=4)
    occupied = Column(Integer, default=4)
    status = Column(String, default="occupied")  # 'available' | 'occupied' | 'maintenance'
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
    roll_no = Column(String, nullable=True, index=True)
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

