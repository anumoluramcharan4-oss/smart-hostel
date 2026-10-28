import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.main import app
from backend.app.db.session import Base, get_db
from backend.app.models.parcel import Parcel, ParcelStatus, ParcelPickupCode

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

def test_register_parcel_locker_collision_and_secure_otp():
    # 1. Register parcel into Locker 12
    payload = {
        "recipient_student_id": "STU101",
        "recipient_name": "Alex Johnson",
        "recipient_room": "204",
        "recipient_block": "Block A",
        "courier": "Amazon Prime",
        "tracking_number": "AMZ-99881122",
        "storage_location": "Locker 12",
        "locker_number": "12"
    }
    res = client.post("/api/v1/parcels", json=payload, headers={"X-User-Role": "staff"})
    assert res.status_code == 200
    parcel = res.json()
    assert parcel["parcel_ref"].startswith("PCL-")
    assert parcel["status"] == "AWAITING_COLLECTION"
    parcel_ref = parcel["parcel_ref"]

    # 2. Attempt to register another package in Locker 12 while occupied -> Collision rejection
    payload2 = {
        "recipient_student_id": "STU102",
        "recipient_name": "Beth Davis",
        "courier": "BlueDart",
        "storage_location": "Locker 12",
        "locker_number": "12"
    }
    collision_res = client.post("/api/v1/parcels", json=payload2, headers={"X-User-Role": "staff"})
    assert collision_res.status_code == 400
    assert "already occupied" in collision_res.json()["detail"]

    # 3. Student fetches their own parcel and receives the secret OTP
    student_res = client.get("/api/v1/parcels/student/my-parcels", headers={"X-User-Id": "STU101"})
    assert student_res.status_code == 200
    student_parcels = student_res.json()
    assert len(student_parcels) == 1
    otp = student_parcels[0]["active_pickup_code"]
    assert otp is not None
    assert len(otp) == 6

    # General list endpoint does NOT expose the active OTP code to random viewers
    gen_res = client.get("/api/v1/parcels")
    assert "active_pickup_code" not in gen_res.json()[0]

def test_parcel_collection_rate_limit_and_single_use():
    payload = {
        "recipient_student_id": "STU105",
        "recipient_name": "Charlie Miller",
        "courier": "DHL Express",
        "storage_location": "Shelf B-2"
    }
    res = client.post("/api/v1/parcels", json=payload, headers={"X-User-Role": "staff"})
    parcel_ref = res.json()["parcel_ref"]

    # Student retrieves OTP
    student_res = client.get("/api/v1/parcels/student/my-parcels", headers={"X-User-Id": "STU105"})
    otp = student_res.json()[0]["active_pickup_code"]

    # 1. Invalid OTP attempt fails
    wrong_res = client.post(
        "/api/v1/parcels/verify-collect",
        json={"parcel_ref": parcel_ref, "pickup_code": "000000", "staff_id": "STF01", "staff_name": "Desk Guard"}
    )
    assert wrong_res.status_code == 400
    assert "Invalid pickup code" in wrong_res.json()["detail"]

    # 2. Correct OTP successfully collects
    collect_res = client.post(
        "/api/v1/parcels/verify-collect",
        json={"parcel_ref": parcel_ref, "pickup_code": otp, "staff_id": "STF01", "staff_name": "Desk Guard"}
    )
    assert collect_res.status_code == 200
    assert collect_res.json()["status"] == "COLLECTED"

    # 3. Duplicate collection attempt rejected
    dup_res = client.post(
        "/api/v1/parcels/verify-collect",
        json={"parcel_ref": parcel_ref, "pickup_code": otp, "staff_id": "STF01", "staff_name": "Desk Guard"}
    )
    assert dup_res.status_code == 400
    assert "already collected" in dup_res.json()["detail"]
