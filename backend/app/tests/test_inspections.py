import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.main import app
from backend.app.db.session import Base, get_db
from backend.app.models.inspection import Inspection, InspectionStatus

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

def test_room_inspection_scoring_and_corrective_action_dispatch():
    # 1. Schedule room inspection for Room 204
    sched_payload = {
        "block": "Block A",
        "floor": 2,
        "room_number": "204",
        "inspector_id": "WAR001",
        "inspector_name": "Warden Dave",
        "scheduled_date": "2026-10-29",
        "general_notes": "Routine weekly hygiene and furniture audit"
    }
    sched_res = client.post("/api/v1/inspections/schedule", json=sched_payload, headers={"X-User-Role": "warden"})
    assert sched_res.status_code == 200
    inspection = sched_res.json()
    assert inspection["inspection_ref"].startswith("INS-")
    assert inspection["status"] == "SCHEDULED"
    inspection_id = inspection["id"]

    # 2. Submit execution with 6 criteria:
    # 3 PASS (100 each), 1 NEEDS_ATTENTION (50), 1 FAIL (0), 1 NOT_APPLICABLE (excluded)
    # Total evaluable = 5. Total sum = 100+100+100+50+0 = 350. Cleanliness score = 350 / 5 = 70.0%
    exec_payload = {
        "results": [
            {"criterion_name": "Floor Cleanliness", "category": "CLEANLINESS", "result": "PASS"},
            {"criterion_name": "Waste Disposal", "category": "CLEANLINESS", "result": "PASS"},
            {"criterion_name": "Bathroom & Hygiene", "category": "CLEANLINESS", "result": "NEEDS_ATTENTION", "notes": "Mirror stained"},
            {"criterion_name": "Lights & Fans", "category": "ELECTRICAL", "result": "PASS"},
            {"criterion_name": "Study Chair Wheels", "category": "FURNITURE", "result": "FAIL", "notes": "Left castor broken", "severity": "HIGH"},
            {"criterion_name": "Balcony Cleanliness", "category": "CLEANLINESS", "result": "NOT_APPLICABLE"}
        ],
        "general_notes": "Room generally neat; chair castor needs replacement and mirror wiping."
    }
    exec_res = client.post(
        f"/api/v1/inspections/{inspection_id}/submit",
        json=exec_payload,
        headers={"X-User-Role": "warden"}
    )
    assert exec_res.status_code == 200
    completed = exec_res.json()
    assert completed["cleanliness_score"] == 70.0
    assert completed["overall_result"] == "PASS"

    # Automated corrective actions:
    # Bathroom -> Housekeeping task; Study Chair -> Staff & Maintenance ticket
    actions = completed["corrective_actions"]
    assert len(actions) == 2
    
    housekeeping = next(a for a in actions if a["criterion_name"] == "Bathroom & Hygiene")
    assert housekeeping["action_type"] == "HOUSEKEEPING_DISPATCH"
    assert housekeeping["assignee"] == "Housekeeping Staff"

    maintenance = next(a for a in actions if a["criterion_name"] == "Study Chair Wheels")
    assert maintenance["action_type"] == "MAINTENANCE_TICKET"
    assert maintenance["linked_maintenance_ticket_id"].startswith("MNT-INSP-")

    # Re-submitting locked inspection is rejected
    dup_res = client.post(
        f"/api/v1/inspections/{inspection_id}/submit",
        json=exec_payload,
        headers={"X-User-Role": "warden"}
    )
    assert dup_res.status_code == 400
    assert "already submitted" in dup_res.json()["detail"]
