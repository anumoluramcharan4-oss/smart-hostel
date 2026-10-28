import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.main import app
from backend.app.db.session import Base, get_db
from backend.app.models.asset import Asset, AssetCondition, AssetLifecycleStatus, ConsumableItem

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)

client = TestClient(app)

def test_asset_lifecycle_register_transfer_and_history():
    # 1. Register asset
    payload = {
        "asset_tag": "AST-BLK-A-RM204-FAN-01",
        "name": "Ceiling Fan 56-inch",
        "category": "ELECTRICAL_FIXTURE",
        "block": "Block A",
        "floor": 2,
        "room_number": "204",
        "purchase_cost": 2400.0,
        "condition": "GOOD",
        "status": "IN_USE"
    }
    res = client.post("/api/v1/assets", json=payload, headers={"X-User-Role": "admin"})
    assert res.status_code == 200
    asset = res.json()
    assert asset["asset_tag"] == "AST-BLK-A-RM204-FAN-01"
    assert len(asset["movements"]) == 1
    asset_id = asset["id"]

    # Student cannot transfer asset (Forbidden)
    forbidden_res = client.post(
        f"/api/v1/assets/{asset_id}/transfer",
        json={"to_block": "Block B", "to_floor": 1, "to_room_number": "105"},
        headers={"X-User-Role": "student"}
    )
    assert forbidden_res.status_code == 403

    # Warden transfers asset
    transfer_res = client.post(
        f"/api/v1/assets/{asset_id}/transfer",
        json={"to_block": "Block B", "to_floor": 1, "to_room_number": "105", "reason": "Room renovation transfer"},
        headers={"X-User-Role": "warden"}
    )
    assert transfer_res.status_code == 200
    updated = transfer_res.json()
    assert updated["block"] == "Block B"
    assert updated["room_number"] == "105"
    assert len(updated["movements"]) == 2
    assert "Block A" in updated["movements"][1]["from_location"]
    assert "Block B" in updated["movements"][1]["to_location"]

def test_asset_damage_report_and_maintenance_integration():
    # Register chair
    payload = {
        "asset_tag": "AST-BLK-A-RM204-CHR-01",
        "name": "Ergonomic Study Chair",
        "category": "FURNITURE",
        "block": "Block A",
        "floor": 2,
        "room_number": "204",
        "purchase_cost": 3500.0
    }
    res = client.post("/api/v1/assets", json=payload, headers={"X-User-Role": "admin"})
    asset_id = res.json()["id"]

    # Report damage
    damage_payload = {
        "reported_by": "Warden Dave",
        "description": "Right wheel broken and hydraulic cylinder leaking",
        "priority": "high",
        "estimated_cost": 650.0
    }
    dmg_res = client.post(f"/api/v1/assets/{asset_id}/damage-report", json=damage_payload)
    assert dmg_res.status_code == 200
    damage = dmg_res.json()
    assert damage["maintenance_ticket_id"].startswith("MNT-")
    damage_id = damage["id"]

    # Asset condition should now be DAMAGED and status UNDER_REPAIR
    asset_res = client.get(f"/api/v1/assets/{asset_id}")
    assert asset_res.json()["condition"] == "DAMAGED"
    assert asset_res.json()["status"] == "UNDER_REPAIR"

    # Maintenance resolves repair
    resolve_res = client.post(f"/api/v1/assets/repairs/{damage_id}/resolve?actual_cost=600.0&actor_id=carpenter_john")
    assert resolve_res.status_code == 200
    assert resolve_res.json()["resolution_status"] == "REPAIRED"

    # Asset restored to GOOD and IN_USE
    asset_res2 = client.get(f"/api/v1/assets/{asset_id}")
    assert asset_res2.json()["condition"] == "GOOD"
    assert asset_res2.json()["status"] == "IN_USE"

def test_consumable_stock_and_negative_stock_rejection():
    # Create consumable item
    item_payload = {
        "item_code": "CON-LED-BULB-9W",
        "name": "LED Bulb 9W Cool White",
        "category": "ELECTRICAL_SUPPLIES",
        "unit": "pcs",
        "current_stock": 25,
        "min_threshold": 10
    }
    res = client.post("/api/v1/assets/consumables", json=item_payload)
    assert res.status_code == 200
    item_id = res.json()["id"]

    # Issue 10 bulbs
    tx_res = client.post(
        f"/api/v1/assets/consumables/{item_id}/transact",
        json={"transaction_type": "ISSUED", "quantity": 10, "reference": "Corridor lighting Block A"}
    )
    assert tx_res.status_code == 200
    assert tx_res.json()["current_stock"] == 15

    # Attempt to issue 20 bulbs (exceeds current stock 15 -> must reject negative stock)
    neg_res = client.post(
        f"/api/v1/assets/consumables/{item_id}/transact",
        json={"transaction_type": "ISSUED", "quantity": 20, "reference": "Excessive request"}
    )
    assert neg_res.status_code == 400
    assert "Current available stock is only 15" in neg_res.json()["detail"]
