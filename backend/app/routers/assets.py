from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, Header
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.asset import Asset, ConsumableItem, AssetLifecycleStatus, AssetCategory, AssetCondition
from backend.app.schemas.asset import (
    AssetCreate,
    AssetResponse,
    AssetTransfer,
    AssetDamageReportCreate,
    AssetDamageResponse,
    ConsumableItemCreate,
    ConsumableItemResponse,
    StockTransactionCreate,
    InventoryStats
)
from backend.app.services.asset_service import AssetService

router = APIRouter(prefix="/assets", tags=["Inventory & Asset Management"])

def get_current_user_role(x_user_role: Optional[str] = Header(None, alias="X-User-Role")) -> str:
    return (x_user_role or "admin").lower()

@router.get("/stats", response_model=InventoryStats)
def get_inventory_stats(db: Session = Depends(get_db)):
    return AssetService.get_stats(db)

@router.get("", response_model=List[AssetResponse])
def list_assets(
    block: Optional[str] = None,
    room_number: Optional[str] = None,
    category: Optional[AssetCategory] = None,
    status: Optional[AssetLifecycleStatus] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Asset)
    if block:
        query = query.filter(Asset.block == block)
    if room_number:
        query = query.filter(Asset.room_number == room_number)
    if category:
        query = query.filter(Asset.category == category)
    if status:
        query = query.filter(Asset.status == status)
    if search:
        query = query.filter(
            (Asset.name.ilike(f"%{search}%")) |
            (Asset.asset_tag.ilike(f"%{search}%")) |
            (Asset.room_number.ilike(f"%{search}%"))
        )
    return query.order_by(Asset.created_at.desc()).all()

@router.post("", response_model=AssetResponse)
def create_asset(
    data: AssetCreate,
    db: Session = Depends(get_db),
    role: str = Depends(get_current_user_role)
):
    if role not in ["admin", "warden"]:
        raise HTTPException(status_code=403, detail="Forbidden: Only admin or warden can register assets")
    return AssetService.create_asset(db, data)

@router.get("/room-inventory/{block}/{room_number}", response_model=List[AssetResponse])
def get_room_inventory(block: str, room_number: str, db: Session = Depends(get_db)):
    """Returns all assets assigned to a particular room with their current operational conditions."""
    return db.query(Asset).filter(Asset.block == block, Asset.room_number == room_number).all()

@router.get("/{asset_id}", response_model=AssetResponse)
def get_asset(asset_id: str, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset

@router.post("/{asset_id}/transfer", response_model=AssetResponse)
def transfer_asset(
    asset_id: str,
    transfer: AssetTransfer,
    db: Session = Depends(get_db),
    role: str = Depends(get_current_user_role)
):
    if role not in ["admin", "warden"]:
        raise HTTPException(status_code=403, detail="Forbidden: Only admin or warden can transfer assets")
    return AssetService.transfer_asset(db, asset_id, transfer)

@router.post("/{asset_id}/damage-report", response_model=AssetDamageResponse)
def report_damage(
    asset_id: str,
    report: AssetDamageReportCreate,
    db: Session = Depends(get_db)
):
    return AssetService.report_damage(db, asset_id, report)

@router.post("/repairs/{damage_id}/resolve", response_model=AssetDamageResponse)
def resolve_repair(
    damage_id: str,
    actual_cost: float = Query(0.0),
    actor_id: str = Query("maintenance_tech"),
    db: Session = Depends(get_db)
):
    return AssetService.resolve_repair(db, damage_id, actual_cost, actor_id)

# Consumables Stock Endpoints
@router.get("/consumables/list", response_model=List[ConsumableItemResponse])
def list_consumables(db: Session = Depends(get_db)):
    return db.query(ConsumableItem).order_by(ConsumableItem.name.asc()).all()

@router.post("/consumables", response_model=ConsumableItemResponse)
def create_consumable(data: ConsumableItemCreate, db: Session = Depends(get_db)):
    return AssetService.create_consumable(db, data)

@router.post("/consumables/{item_id}/transact", response_model=ConsumableItemResponse)
def transact_stock(
    item_id: str,
    tx: StockTransactionCreate,
    db: Session = Depends(get_db)
):
    return AssetService.process_stock_transaction(db, item_id, tx)
