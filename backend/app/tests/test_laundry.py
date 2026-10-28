import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.main import app
from backend.app.db.session import Base, get_db
from backend.app.models.laundry import LaundryOrder, LaundrySlot, LaundryOrderStatus

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

def test_laundry_booking_server_side_pricing_and_student_isolation():
    # 1. Book laundry order
    # 2 shirts (15 ea = 30) + 1 bedsheet (35 ea = 35) -> Expected total = 65.0
    payload = {
        "student_id": "STU101",
        "student_name": "Alex Johnson",
        "room_number": "204",
        "block_name": "Block A",
        "service_type": "WASH_AND_IRON",
        "pickup_date": "2026-10-30",
        "pickup_time_slot": "09:00 - 11:00 AM",
        "items": [
            {"item_category": "SHIRT", "quantity": 2},
            {"item_category": "BEDSHEET", "quantity": 1}
        ],
        "special_instructions": "Mild detergent please",
        "bill_to_fees": True
    }
    res = client.post("/api/v1/laundry/book", json=payload)
    assert res.status_code == 200
    order = res.json()
    assert order["order_ref"].startswith("LND-")
    assert order["submitted_item_count"] == 3
    assert order["estimated_amount"] == 65.0
    assert order["final_amount"] == 65.0
    assert order["billing_status"] == "BILLED_TO_FEES"
    assert order["fee_transaction_id"].startswith("FEE-LND-")
    order_id = order["id"]

    # Student isolation check: Student STU101 sees their order
    s1_res = client.get("/api/v1/laundry", headers={"X-User-Role": "student", "X-User-Id": "STU101"})
    assert s1_res.status_code == 200
    assert len(s1_res.json()) == 1

    # Student STU102 CANNOT see STU101's order
    s2_res = client.get("/api/v1/laundry", headers={"X-User-Role": "student", "X-User-Id": "STU102"})
    assert s2_res.status_code == 200
    assert len(s2_res.json()) == 0

def test_laundry_count_mismatch_and_intake_verification():
    # Book with 3 shirts
    payload = {
        "student_id": "STU103",
        "student_name": "David Clark",
        "pickup_date": "2026-10-31",
        "pickup_time_slot": "04:00 - 06:00 PM",
        "items": [
            {"item_category": "SHIRT", "quantity": 3}
        ]
    }
    book_res = client.post("/api/v1/laundry/book", json=payload)
    order_id = book_res.json()["id"]

    # Laundry staff counts and finds only 2 shirts (Mismatch of 1 item)
    verify_payload = {
        "confirmed_counts": [
            {"item_category": "SHIRT", "quantity": 2}
        ],
        "staff_id": "LND-TECH-1",
        "staff_name": "Ramesh Laundry Operator"
    }
    conf_res = client.post(
        f"/api/v1/laundry/{order_id}/confirm-counts",
        json=verify_payload,
        headers={"X-User-Role": "staff"}
    )
    assert conf_res.status_code == 200
    updated = conf_res.json()
    assert updated["confirmed_item_count"] == 2
    assert updated["count_mismatch_noted"] == "TRUE"
    # Recalculated final: 2 * 15 = 30.0
    assert updated["final_amount"] == 30.0
    assert updated["status"] == "COLLECTED"

def test_laundry_slot_capacity_limit():
    # Slot with 1 capacity
    with TestingSessionLocal() as db:
        slot = LaundrySlot(
            slot_date="2026-11-01",
            time_window="08:00 - 09:00 AM",
            max_capacity=1,
            booked_count=1
        )
        db.add(slot)
        db.commit()

    # Attempt to book another order in the full slot -> Rejected
    payload = {
        "student_id": "STU104",
        "student_name": "Emma Watson",
        "pickup_date": "2026-11-01",
        "pickup_time_slot": "08:00 - 09:00 AM",
        "items": [{"item_category": "TOWEL", "quantity": 1}]
    }
    res = client.post("/api/v1/laundry/book", json=payload)
    assert res.status_code == 400
    assert "fully booked" in res.json()["detail"]
