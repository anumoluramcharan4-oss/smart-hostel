from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from backend.app.models.asset import AssetCondition, AssetLifecycleStatus, AssetCategory

class AssetBase(BaseModel):
    asset_tag: str = Field(..., min_length=3, max_length=50)
    name: str = Field(..., min_length=2, max_length=100)
    category: AssetCategory
    description: Optional[str] = None
    serial_number: Optional[str] = None
    building: str = "Main Campus"
    block: str
    floor: int = 1
    room_number: Optional[str] = None
    bed_number: Optional[str] = None
    purchase_cost: float = 0.0
    warranty_expiry: Optional[datetime] = None
    condition: AssetCondition = AssetCondition.GOOD
    status: AssetLifecycleStatus = AssetLifecycleStatus.IN_USE
    notes: Optional[str] = None

class AssetCreate(AssetBase):
    pass

class AssetTransfer(BaseModel):
    to_block: str
    to_floor: int
    to_room_number: Optional[str] = None
    to_bed_number: Optional[str] = None
    reason: Optional[str] = "Relocation"
    actor_id: str = "admin"

class AssetDamageReportCreate(BaseModel):
    reported_by: str
    description: str = Field(..., min_length=5)
    priority: str = "high"
    estimated_cost: float = 0.0

class AssetMovementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    asset_id: str
    from_location: str
    to_location: str
    actor_id: str
    reason: Optional[str] = None
    timestamp: datetime

class AssetDamageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    asset_id: str
    reported_by: str
    description: str
    priority: str
    maintenance_ticket_id: Optional[str] = None
    repair_cost: float
    resolution_status: str
    created_at: datetime

class AssetResponse(AssetBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    updated_at: datetime
    movements: List[AssetMovementResponse] = []
    damage_reports: List[AssetDamageResponse] = []

class ConsumableItemCreate(BaseModel):
    item_code: str
    name: str
    category: str = "CLEANING_SUPPLIES"
    unit: str = "pcs"
    current_stock: int = 0
    min_threshold: int = 10
    supplier_name: Optional[str] = None

class StockTransactionCreate(BaseModel):
    transaction_type: str # RECEIVED, ISSUED, CONSUMED, RETURNED
    quantity: int = Field(..., gt=0)
    actor_id: str = "admin"
    reference: Optional[str] = None

class ConsumableItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    item_code: str
    name: str
    category: str
    unit: str
    current_stock: int
    min_threshold: int
    supplier_name: Optional[str] = None
    created_at: datetime

class InventoryStats(BaseModel):
    total_assets: int
    damaged_assets: int
    under_repair_assets: int
    retired_assets: int
    low_stock_items: int
    total_asset_value: float
