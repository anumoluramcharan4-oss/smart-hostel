"""Database models for Smart Hostel"""
from .visitor import Visitor, VisitorPass, VisitorEvent, VisitorStatus, VisitorCategory
from .asset import Asset, ConsumableItem, AssetMovement, AssetDamageReport, InventoryTransaction
from .parcel import Parcel, ParcelPickupCode, ParcelEvent, ParcelStatus
from .laundry import LaundryRate, LaundrySlot, LaundryOrder, LaundryOrderItem, LaundryStatusEvent
from .inspection import InspectionTemplate, InspectionTemplateItem, Inspection, InspectionResult, CorrectiveAction

__all__ = [
    "Visitor", "VisitorPass", "VisitorEvent", "VisitorStatus", "VisitorCategory",
    "Asset", "ConsumableItem", "AssetMovement", "AssetDamageReport", "InventoryTransaction",
    "Parcel", "ParcelPickupCode", "ParcelEvent", "ParcelStatus",
    "LaundryRate", "LaundrySlot", "LaundryOrder", "LaundryOrderItem", "LaundryStatusEvent",
    "InspectionTemplate", "InspectionTemplateItem", "Inspection", "InspectionResult", "CorrectiveAction"
]
