import enum
from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, Enum, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.db.session import Base

class InspectionStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    OVERDUE = "OVERDUE"
    FOLLOW_UP_REQUIRED = "FOLLOW_UP_REQUIRED"
    CANCELLED = "CANCELLED"

class ItemResultStatus(str, enum.Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    NEEDS_ATTENTION = "NEEDS_ATTENTION"
    NOT_APPLICABLE = "NOT_APPLICABLE"

class InspectionSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class InspectionTemplate(Base):
    __tablename__ = "inspection_templates"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(100), nullable=False) # e.g. "Weekly Dorm & Hygiene Checklist"
    description = Column(Text, nullable=True)
    is_active = Column(String(10), default="TRUE", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    items = relationship("InspectionTemplateItem", back_populates="template", cascade="all, delete-orphan")

class InspectionTemplateItem(Base):
    __tablename__ = "inspection_template_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    template_id = Column(String, ForeignKey("inspection_templates.id"), nullable=False, index=True)
    criterion_name = Column(String(100), nullable=False) # e.g. "Bathroom Sanitation", "Light/Fan Fixtures"
    category = Column(String(50), nullable=False) # CLEANLINESS, ELECTRICAL, FURNITURE, PLUMBING
    weight = Column(Integer, default=1, nullable=False) # 1 to 5 weight in score
    severity = Column(Enum(InspectionSeverity), default=InspectionSeverity.MEDIUM, nullable=False)

    template = relationship("InspectionTemplate", back_populates="items")

class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    inspection_ref = Column(String(50), unique=True, nullable=False, index=True) # e.g. INS-2026-8812
    template_id = Column(String, ForeignKey("inspection_templates.id"), nullable=False)

    # Location
    building = Column(String(50), default="Main Campus", nullable=False)
    block = Column(String(50), nullable=False, index=True)
    floor = Column(Integer, default=1, nullable=False)
    room_number = Column(String(50), nullable=False, index=True)

    # Inspector
    inspector_id = Column(String(100), nullable=False)
    inspector_name = Column(String(100), nullable=False)

    scheduled_date = Column(String(20), nullable=False) # YYYY-MM-DD
    completed_at = Column(DateTime, nullable=True)

    # Cleanliness Score: Calculated formula excluding N/A items
    cleanliness_score = Column(Float, nullable=True) # 0 to 100
    overall_result = Column(String(20), default="PENDING", nullable=False) # PASS, FAIL, PENDING
    status = Column(Enum(InspectionStatus), default=InspectionStatus.SCHEDULED, nullable=False, index=True)
    general_notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    results = relationship("InspectionResult", back_populates="inspection", cascade="all, delete-orphan")
    corrective_actions = relationship("CorrectiveAction", back_populates="inspection", cascade="all, delete-orphan")

class InspectionResult(Base):
    __tablename__ = "inspection_results"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    inspection_id = Column(String, ForeignKey("inspections.id"), nullable=False, index=True)
    criterion_name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
    result = Column(Enum(ItemResultStatus), default=ItemResultStatus.PASS, nullable=False)
    notes = Column(Text, nullable=True)
    flagged_issue = Column(String(10), default="FALSE", nullable=False)

    inspection = relationship("Inspection", back_populates="results")

class CorrectiveAction(Base):
    __tablename__ = "corrective_actions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    inspection_id = Column(String, ForeignKey("inspections.id"), nullable=False, index=True)
    criterion_name = Column(String(100), nullable=False)
    action_type = Column(String(50), nullable=False) # HOUSEKEEPING_DISPATCH, MAINTENANCE_TICKET, ASSET_REPLACEMENT
    assignee = Column(String(100), nullable=False)
    priority = Column(String(20), default="high", nullable=False)
    linked_maintenance_ticket_id = Column(String(100), nullable=True) # Integrated into Staff & Maintenance module
    status = Column(String(50), default="OPEN", nullable=False) # OPEN, IN_PROGRESS, RESOLVED, VERIFIED
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime, nullable=True)

    inspection = relationship("Inspection", back_populates="corrective_actions")
