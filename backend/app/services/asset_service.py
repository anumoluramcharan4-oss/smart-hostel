import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import HTTPException
from sqlalchemy.orm import Session
from backend.app.models.asset import (
    Asset,
    AssetMovement,
    AssetDamageReport,
    ConsumableItem,
    InventoryTransaction,
    AssetCondition,
    AssetLifecycleStatus
)
from backend.app.schemas.asset import (
    AssetCreate,
    AssetTransfer,
    AssetDamageReportCreate,
    ConsumableItemCreate,
    StockTransactionCreate
)

class AssetService:
    @staticmethod
    def create_asset(db: Session, data: AssetCreate) -> Asset:
        existing = db.query(Asset).filter(Asset.asset_tag == data.asset_tag).first()
        if existing:
            raise HTTPException(status_code=400, detail="Asset tag already registered. Must be unique.")

        asset = Asset(
            asset_tag=data.asset_tag,
            name=data.name,
            category=data.category,
            description=data.description,
            serial_number=data.serial_number,
            building=data.building,
            block=data.block,
            floor=data.floor,
            room_number=data.room_number,
            bed_number=data.bed_number,
            purchase_cost=data.purchase_cost,
            warranty_expiry=data.warranty_expiry,
            condition=data.condition,
            status=data.status,
            notes=data.notes
        )
        db.add(asset)
        db.flush()

        # Record initial movement location
        loc_str = f"{data.block} Floor {data.floor}" + (f" Room {data.room_number}" if data.room_number else "")
        movement = AssetMovement(
            asset_id=asset.id,
            from_location="WAREHOUSE / PROCUREMENT",
            to_location=loc_str,
            actor_id="admin",
            reason="Initial Asset Commissioning"
        )
        db.add(movement)
        db.commit()
        db.refresh(asset)
        return asset

    @staticmethod
    def transfer_asset(db: Session, asset_id: str, transfer: AssetTransfer) -> Asset:
        asset = db.query(Asset).filter(Asset.id == asset_id).first()
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")

        if asset.status == AssetLifecycleStatus.RETIRED:
            raise HTTPException(status_code=400, detail="Cannot transfer retired asset")

        from_loc = f"{asset.block} Floor {asset.floor} Room {asset.room_number or 'N/A'}"
        to_loc = f"{transfer.to_block} Floor {transfer.to_floor} Room {transfer.to_room_number or 'N/A'}"

        movement = AssetMovement(
            asset_id=asset.id,
            from_location=from_loc,
            to_location=to_loc,
            actor_id=transfer.actor_id,
            reason=transfer.reason
        )
        db.add(movement)

        asset.block = transfer.to_block
        asset.floor = transfer.to_floor
        asset.room_number = transfer.to_room_number
        asset.bed_number = transfer.to_bed_number

        db.commit()
        db.refresh(asset)
        return asset

    @staticmethod
    def report_damage(db: Session, asset_id: str, report: AssetDamageReportCreate) -> AssetDamageReport:
        asset = db.query(Asset).filter(Asset.id == asset_id).first()
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")

        # Direct integration with Staff & Maintenance ticket ID
        ticket_id = f"MNT-{uuid.uuid4().hex[:6].upper()}"

        damage = AssetDamageReport(
            asset_id=asset.id,
            reported_by=report.reported_by,
            description=report.description,
            priority=report.priority,
            maintenance_ticket_id=ticket_id,
            repair_cost=report.estimated_cost,
            resolution_status="REPORTED"
        )
        db.add(damage)

        # Update asset condition & status
        asset.condition = AssetCondition.DAMAGED
        asset.status = AssetLifecycleStatus.UNDER_REPAIR

        db.commit()
        db.refresh(damage)
        return damage

    @staticmethod
    def resolve_repair(db: Session, damage_id: str, actual_cost: float, actor_id: str) -> AssetDamageReport:
        damage = db.query(AssetDamageReport).filter(AssetDamageReport.id == damage_id).first()
        if not damage:
            raise HTTPException(status_code=404, detail="Damage report not found")

        damage.resolution_status = "REPAIRED"
        damage.repair_cost = actual_cost

        asset = damage.asset
        asset.condition = AssetCondition.GOOD
        asset.status = AssetLifecycleStatus.IN_USE

        movement = AssetMovement(
            asset_id=asset.id,
            from_location="MAINTENANCE WORKSHOP",
            to_location=f"{asset.block} Room {asset.room_number or 'N/A'}",
            actor_id=actor_id,
            reason=f"Repaired and restored via ticket {damage.maintenance_ticket_id}"
        )
        db.add(movement)
        db.commit()
        db.refresh(damage)
        return damage

    @staticmethod
    def create_consumable(db: Session, data: ConsumableItemCreate) -> ConsumableItem:
        existing = db.query(ConsumableItem).filter(ConsumableItem.item_code == data.item_code).first()
        if existing:
            raise HTTPException(status_code=400, detail="Item code already exists")
        item = ConsumableItem(**data.model_dump())
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def process_stock_transaction(db: Session, item_id: str, tx: StockTransactionCreate) -> ConsumableItem:
        item = db.query(ConsumableItem).filter(ConsumableItem.id == item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Consumable item not found")

        if tx.transaction_type in ["ISSUED", "CONSUMED"]:
            if item.current_stock < tx.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot issue {tx.quantity} {item.unit}. Current available stock is only {item.current_stock}."
                )
            item.current_stock -= tx.quantity
        elif tx.transaction_type in ["RECEIVED", "RETURNED"]:
            item.current_stock += tx.quantity
        else:
            raise HTTPException(status_code=400, detail=f"Invalid transaction type {tx.transaction_type}")

        transaction = InventoryTransaction(
            item_id=item.id,
            transaction_type=tx.transaction_type,
            quantity=tx.quantity,
            actor_id=tx.actor_id,
            reference=tx.reference
        )
        db.add(transaction)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def get_stats(db: Session):
        total_assets = db.query(Asset).count()
        damaged = db.query(Asset).filter(Asset.condition == AssetCondition.DAMAGED).count()
        under_repair = db.query(Asset).filter(Asset.status == AssetLifecycleStatus.UNDER_REPAIR).count()
        retired = db.query(Asset).filter(Asset.status == AssetLifecycleStatus.RETIRED).count()
        
        low_stock = db.query(ConsumableItem).filter(ConsumableItem.current_stock <= ConsumableItem.min_threshold).count()
        all_assets = db.query(Asset).all()
        total_val = sum(a.purchase_cost for a in all_assets)

        return {
            "total_assets": total_assets,
            "damaged_assets": damaged,
            "under_repair_assets": under_repair,
            "retired_assets": retired,
            "low_stock_items": low_stock,
            "total_asset_value": round(total_val, 2)
        }
