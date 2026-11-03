import pytest
from backend.app.models.hostel import Staff

EXPECTED_TRADES = [
    "Electrical",
    "Plumbing & Water",
    "Wi-Fi & Internet",
    "Housekeeping / Cleaning",
    "Mess & Dining",
    "Carpentry / Furniture",
    "General Maintenance",
]

STAFF_SEED_DATA = [
    ("stf-elec-1", "Ramesh Kumar", "9820145231", "Electrical"),
    ("stf-elec-2", "Rajesh Verma", "9711894320", "Electrical"),
    ("stf-plumb-1", "Suresh Patel", "8826541098", "Plumbing & Water"),
    ("stf-plumb-2", "Mahendra Yadav", "8700234189", "Plumbing & Water"),
    ("stf-wifi-1", "Amit Sharma", "7982410567", "Wi-Fi & Internet"),
    ("stf-wifi-2", "Vikram Rathore", "7838129045", "Wi-Fi & Internet"),
    ("stf-clean-1", "Santosh Meena", "6392018475", "Housekeeping / Cleaning"),
    ("stf-clean-2", "Manoj Chauhan", "6289450123", "Housekeeping / Cleaning"),
    ("stf-mess-1", "Jagdish Singh", "9451203874", "Mess & Dining"),
    ("stf-mess-2", "Dilip Joshi", "8447819203", "Mess & Dining"),
    ("stf-carp-1", "Ramvilas Prajapati", "7303918245", "Carpentry / Furniture"),
    ("stf-carp-2", "Govind Suthar", "6388102947", "Carpentry / Furniture"),
    ("stf-gen-1", "Ashok Gujjar", "9123847510", "General Maintenance"),
    ("stf-gen-2", "Dinesh Solanki", "8130928471", "General Maintenance"),
]


@pytest.fixture(autouse=True)
def seed_staff(db):
    for s_id, s_name, s_phone, s_trade in STAFF_SEED_DATA:
        db.add(
            Staff(
                id=s_id,
                name=s_name,
                phone=s_phone,
                trade=s_trade,
                status="active",
            )
        )
    db.commit()


def test_staff_count_trades_and_unique_phones(db):
    """Verify exactly 14 staff members, 2 per trade across all 7 categories, and unique 10-digit phones."""
    staff_members = db.query(Staff).all()
    # 1. Exactly 14 staff
    assert len(staff_members) == 14, f"Expected 14 staff members, got {len(staff_members)}"

    # 2. No duplicate phone numbers
    phones = [s.phone for s in staff_members]
    assert len(phones) == len(set(phones)), "Duplicate phone numbers found among staff"
    for p in phones:
        assert len(p) == 10, f"Phone number {p} is not 10 digits"
        assert p[0] in "6789", f"Phone number {p} does not start with 6-9"

    # 3. Exactly 2 per trade across all 7 trades
    trades = [s.trade for s in staff_members]
    for expected_trade in EXPECTED_TRADES:
        count = trades.count(expected_trade)
        assert count == 2, f"Expected exactly 2 workers for trade '{expected_trade}', got {count}"

    assert set(trades) == set(EXPECTED_TRADES), f"Trades mismatch: {set(trades)} vs {set(EXPECTED_TRADES)}"


def test_staff_api_endpoint_and_trade_filter(client):
    """Verify GET /api/staff returns all 14 staff and optional ?trade= filter works."""
    # All staff
    res = client.get("/api/staff")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 14

    # Filter by each trade
    for trade in EXPECTED_TRADES:
        res_trade = client.get(f"/api/staff?trade={trade}")
        assert res_trade.status_code == 200
        trade_data = res_trade.json()
        assert len(trade_data) == 2, f"Expected 2 staff for {trade}, got {len(trade_data)}"
        assert all(s["trade"] == trade for s in trade_data)
