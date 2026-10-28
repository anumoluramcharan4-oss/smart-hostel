import enum
from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, Enum, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.db.session import Base

class AssetCondition(str, enum.Enum):
    NEW = "NEW"
    GOOD = "GOOD"
    DAMAGED = "DAMAGED"
    UNDER_REPAIR = "UNDER_REPAIR"
    RETIRED = "RETIRED"

class AssetLifecycleStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    IN_USE = "IN_USE"
    DAMAGED = "DAMAGED"
    UNDER_REPAIR = "UNDER_REPAIR"
    MISSING = "MISSING"
    RETIRED = "RETIRED"

class AssetCategory(str, enum.Enum):
    FURNITURE = "FURNITURE"
    ELECTRICAL_FIXTURE = "ELECTRICAL_FIXTURE"
    APPLIANCE = "APPLIANCE"
    BEDDING = "BEDDING"
    ELECTRONICS = "ELECTRONICS"
    PLUMBING = "PLUMBING"
    OTHER = "OTHER"

class Asset(Base):
    __tablename__ = "assets"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    asset_tag = Column(String(50), unique=True, nullable=False, index=True) # e.g. AST-RM204-FAN-01
    name = Column(String(100), nullable=False, index=True)
    category = Column(Enum(AssetCategory), nullable=False)
    description = Column(Text, nullable=True)
    serial_number = Column(String(100), nullable=True)
    
    # Location Hierarchy
    building = Column(String(50), default="Main Campus", nullable=False)
    block = Column(String(50), nullable=False, index=True)
    floor = Column(Integer, default=1, nullable=False)
    room_number = Column(String(50), nullable=True, index=True)
    bed_number = Column(String(20), nullable=True)

    # Financial & Warranty
    purchase_date = Column(DateTime, nullable=True)
    purchase_cost = Column(Float, default=0.0, nullable=False)
    warranty_expiry = Column(DateTime, nullable=True)

    # Condition & Lifecycle
    condition = Column(Enum(AssetCondition), default=AssetCondition.GOOD, nullable=False)
    status = Column(Enum(AssetLifecycleStatus), default=AssetLifecycleStatus.IN_USE, nullable=False, index=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    movements = relationship("AssetMovement", back_populates="asset", cascade="all, delete-orphan")
    damage_reports = relationship("AssetDamageReport", back_populates="asset", cascade="all, delete-orphan")

class AssetMovement(Base):
    __tablename__ = "asset_movements"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    asset_id = Column(String, ForeignKey("assets.id"), nullable=False, index=True)
    from_location = Column(String(100), nullable=False)
    to_location = Column(String(100), nullable=False)
    actor_id = Column(String(100), nullable=False)
    reason = Column(String(255), nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    asset = relationship("Asset", back_populates="movements")

class AssetDamageReport(Base):
    __tablename__ = "asset_damage_reports"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    asset_id = Column(String, ForeignKey("assets.id"), nullable=False, index=True)
    reported_by = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String(20), default="high", nullable=False) # low, medium, high, urgent
    maintenance_ticket_id = Column(String(100), nullable=True, index=True) # Direct link to Staff & Maintenance ticket
    repair_cost = Column(Float, default=0.0)
    resolution_status = Column(String(50), default="REPORTED", nullable=False) # REPORTED, IN_MAINTENANCE, REPAIRED, REPLACED
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    asset = relationship("Asset", back_populates="damage_reports")

class ConsumableItem(Base):
    __tablename__ = "consumable_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    item_code = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    category = Column(String(50), default="CLEANING_SUPPLIES")
    unit = Column(String(20), default="pcs")
    current_stock = Column(Integer, default=0, nullable=False)
    min_threshold = Column(Integer, default=10, nullable=False) # Triggers low-stock alert
    supplier_name = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    transactions = relationship("InventoryTransaction", back_populates="item", cascade="all, delete-orphan")

class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    item_id = Column(String, ForeignKey("consumable_items.id"), nullable=False, index=True)
    transaction_type = Column(String(20), nullable=False) # RECEIVED, ISSUED, RETURNED, CONSUMED
    quantity = Column(Integer, nullable=False)
    actor_id = Column(String(100), nullable=False)
    reference = Column(String(255), nullable=True) # e.g. Issued for Block A Housekeeping
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    item = relationship("ConsumableItem", back_populates="transactions")
