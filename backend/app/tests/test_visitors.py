import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.main import app
from backend.app.db.session import Base, get_db
from backend.app.models.visitor import Visitor, VisitorStatus, VisitorCategory

# StaticPool ensures the in-memory SQLite database remains alive and shared across threads
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

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_register_visitor_parent_auto_approve():
    now = datetime.now(timezone.utc).replace(hour=10, minute=0, second=0)
    payload = {
        "name": "Jane Doe",
        "phone": "+1234567890",
        "email": "jane@example.com",
        "category": "PARENT",
        "host_student_id": "STU101",
        "host_student_name": "John Doe",
        "host_student_room": "Room 204",
        "host_student_block": "Block A",
        "purpose": "Semester visit and delivering books",
        "expected_arrival": now.isoformat(),
        "expected_departure": (now + timedelta(hours=3)).isoformat()
    }
    res = client.post("/api/v1/visitors", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "Jane Doe"
    assert data["status"] == "APPROVED"
    assert len(data["passes"]) == 1
    assert data["passes"][0]["pass_code"].startswith("VP-")

def test_register_vendor_requires_warden_approval():
    now = datetime.now(timezone.utc).replace(hour=14, minute=0, second=0)
    payload = {
        "name": "Acme Water Vendor",
        "phone": "+1987654321",
        "category": "VENDOR_CONTRACTOR",
        "host_student_id": "STU102",
        "host_student_name": "Alice Smith",
        "purpose": "Filter replacement inspection",
        "expected_arrival": now.isoformat(),
        "expected_departure": (now + timedelta(hours=2)).isoformat()
    }
    res = client.post("/api/v1/visitors", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "PENDING_APPROVAL"
    assert len(data["passes"]) == 0
    visitor_id = data["id"]

    # Student cannot approve (Forbidden)
    forbidden_res = client.post(
        f"/api/v1/visitors/{visitor_id}/review",
        json={"approved": True, "reviewer_id": "STU102", "reviewer_name": "Alice Smith"},
        headers={"X-User-Role": "student"}
    )
    assert forbidden_res.status_code == 403

    # Warden approves
    approve_res = client.post(
        f"/api/v1/visitors/{visitor_id}/review",
        json={"approved": True, "reviewer_id": "WAR001", "reviewer_name": "Warden Dave"},
        headers={"X-User-Role": "warden"}
    )
    assert approve_res.status_code == 200
    approved_data = approve_res.json()
    assert approved_data["status"] == "APPROVED"
    assert len(approved_data["passes"]) == 1

def test_visitor_gate_checkin_checkout_and_duplicate_protection():
    now = datetime.now(timezone.utc)
    payload = {
        "name": "Robert Friend",
        "phone": "+1122334455",
        "category": "PARENT",
        "host_student_id": "STU103",
        "host_student_name": "Mark Davis",
        "purpose": "Weekend lunch",
        "expected_arrival": now.isoformat(),
        "expected_departure": (now + timedelta(hours=4)).isoformat()
    }
    res = client.post("/api/v1/visitors", json=payload)
    data = res.json()
    visitor_id = data["id"]
    pass_code = data["passes"][0]["pass_code"]

    # Verify pass
    verify_res = client.post("/api/v1/visitors/verify-pass", json={"pass_code": pass_code})
    assert verify_res.status_code == 200
    assert verify_res.json()["valid"] is True

    # Check In at gate
    checkin_res = client.post(
        f"/api/v1/visitors/{visitor_id}/check-in",
        json={"actor_id": "SEC01", "actor_name": "Guard James"}
    )
    assert checkin_res.status_code == 200
    assert checkin_res.json()["status"] == "CHECKED_IN"

    # Duplicate check in rejected
    dup_res = client.post(
        f"/api/v1/visitors/{visitor_id}/check-in",
        json={"actor_id": "SEC01", "actor_name": "Guard James"}
    )
    assert dup_res.status_code == 400
    assert "already checked in" in dup_res.json()["detail"]

    # Live inside list shows visitor
    inside_res = client.get("/api/v1/visitors/live-inside")
    assert inside_res.status_code == 200
    assert any(v["id"] == visitor_id for v in inside_res.json())

    # Check Out
    checkout_res = client.post(
        f"/api/v1/visitors/{visitor_id}/check-out",
        json={"actor_id": "SEC01", "actor_name": "Guard James"}
    )
    assert checkout_res.status_code == 200
    assert checkout_res.json()["status"] == "CHECKED_OUT"

    # No longer in live inside
    inside_after = client.get("/api/v1/visitors/live-inside")
    assert not any(v["id"] == visitor_id for v in inside_after.json())
