import pytest
from backend.app.models.hostel import (
    Block,
    Room,
    Profile,
    FeeRecord,
    PaymentTransaction,
)


@pytest.fixture(autouse=True)
def seed_fees_data(db):
    block = Block(id="blk-a", name="Block A", code="A", floors_count=5)
    db.add(block)
    room = Room(id="rm-101", number="A-101", floor=1, type="quad", capacity=4, occupied=3)
    db.add(room)

    stu1 = Profile(
        id="usr-stu-1",
        full_name="Arjun Sharma",
        role="student",
        room_number="A-101",
        fee_status="pending",
        fee_amount_due=45000.0,
    )
    stu2 = Profile(
        id="usr-stu-2",
        full_name="Kabir Sen",
        role="student",
        room_number="A-101",
        fee_status="paid",
        fee_amount_due=0.0,
    )
    stu3 = Profile(
        id="usr-stu-3",
        full_name="Rohan Verma",
        role="student",
        room_number="A-101",
        fee_status="partial",
        fee_amount_due=20000.0,
    )
    db.add_all([stu1, stu2, stu3])

    fee1 = FeeRecord(
        id="fee-stu-1",
        student_id="usr-stu-1",
        student_name="Arjun Sharma",
        roll_no="26CS101",
        room_number="A-101",
        term="Term 1, Autumn 2026-2027",
        total_amount=45000.0,
        paid_amount=0.0,
        pending_amount=45000.0,
        status="pending",
        due_date="2026-11-15",
    )
    fee2 = FeeRecord(
        id="fee-stu-2",
        student_id="usr-stu-2",
        student_name="Kabir Sen",
        roll_no="26CS102",
        room_number="A-101",
        term="Term 1, Autumn 2026-2027",
        total_amount=45000.0,
        paid_amount=45000.0,
        pending_amount=0.0,
        status="paid",
        due_date="2026-11-15",
    )
    fee3 = FeeRecord(
        id="fee-stu-3",
        student_id="usr-stu-3",
        student_name="Rohan Verma",
        roll_no="26CS103",
        room_number="A-101",
        term="Term 1, Autumn 2026-2027",
        total_amount=45000.0,
        paid_amount=25000.0,
        pending_amount=20000.0,
        status="partial",
        due_date="2026-11-15",
    )
    db.add_all([fee1, fee2, fee3])
    db.commit()


def test_pay_pending_fee_success(client, db):
    """Paying a pending fee works and updates fee and profile in single transaction"""
    fee = db.query(FeeRecord).filter(FeeRecord.status == "pending").first()
    assert fee is not None
    initial_pending = float(fee.pending_amount)
    assert initial_pending > 0
    fee_id = fee.id
    student_id = fee.student_id

    # Get stats before payment
    stats_before = client.get("/api/stats").json()
    pending_before = float(stats_before["totalFeesPending"])

    # Make payment
    res = client.post(
        f"/api/fees/{fee_id}/pay",
        json={"mode": "UPI (Google Pay)", "student_id": student_id},
    )
    assert res.status_code == 200, res.text
    data = res.json()

    # Validate returned shape
    assert data["id"] == fee_id
    assert data["studentId"] == student_id
    assert data["status"] == "paid"
    assert data["pendingAmount"] == 0.0
    assert data["paidAmount"] == data["amount"]
    assert data["receiptNumber"] is not None
    assert data["receiptNumber"].startswith("TXN-")
    assert data["paidDate"] is not None
    assert data["mode"] == "UPI (Google Pay)"
    assert data["title"] == "Hostel Fee"
    assert "Autumn" in data["semester"]

    # Verify Profile updated
    profile = db.query(Profile).filter(Profile.id == student_id).first()
    assert profile.fee_status == "paid"
    assert float(profile.fee_amount_due) == 0.0

    # Verify PaymentTransaction in DB
    tx = (
        db.query(PaymentTransaction)
        .filter(PaymentTransaction.fee_id == fee_id)
        .order_by(PaymentTransaction.paid_at.desc())
        .first()
    )
    assert tx is not None
    assert tx.transaction_ref == data["receiptNumber"]
    assert float(tx.amount) == initial_pending

    # Verify GET /api/fees persists and returns receipt
    fees_res = client.get(f"/api/fees?student_id={student_id}")
    assert fees_res.status_code == 200
    fees_list = fees_res.json()
    assert len(fees_list) >= 1
    persisted_fee = next(f for f in fees_list if f["id"] == fee_id)
    assert persisted_fee["status"] == "paid"
    assert persisted_fee["receiptNumber"] == data["receiptNumber"]
    assert persisted_fee["paidDate"] == data["paidDate"]

    # Verify stats reduced by exact amount
    stats_after = client.get("/api/stats").json()
    pending_after = float(stats_after["totalFeesPending"])
    assert round(pending_before - pending_after, 2) == round(initial_pending, 2)


def test_pay_twice_returns_400(client, db):
    """Paying an already paid fee returns 400 Already paid"""
    paid_fee = db.query(FeeRecord).filter(FeeRecord.status == "paid").first()
    assert paid_fee is not None
    fee_id = paid_fee.id

    res = client.post(f"/api/fees/{fee_id}/pay", json={"mode": "NetBanking"})
    assert res.status_code == 400
    assert "Already paid" in res.json().get("detail", "")


def test_unknown_fee_returns_404(client):
    """Paying a non-existent fee returns 404"""
    res = client.post("/api/fees/fee-non-existent-9999/pay", json={"mode": "UPI"})
    assert res.status_code == 404
    assert "Fee record not found" in res.json().get("detail", "")


def test_mismatched_student_id_returns_403(client, db):
    """Providing a mismatched student_id returns 403"""
    fee = db.query(FeeRecord).first()
    assert fee is not None
    fee_id = fee.id
    different_student_id = "usr-different-student-xyz"

    res = client.post(f"/api/fees/{fee_id}/pay", json={"mode": "UPI", "student_id": different_student_id})
    assert res.status_code == 403
    assert "Student ID does not match" in res.json().get("detail", "")


def test_pay_partial_fee_success(client, db):
    """Paying a partial fee pays remaining pending amount and accumulates total paid"""
    fee = db.query(FeeRecord).filter(FeeRecord.status == "partial").first()
    assert fee is not None
    fee_id = fee.id
    student_id = fee.student_id
    pending_amount = float(fee.pending_amount)
    total_amount = float(fee.total_amount)
    assert pending_amount > 0

    res = client.post(f"/api/fees/{fee_id}/pay", json={"mode": "Debit Card", "student_id": student_id})
    assert res.status_code == 200, res.text
    data = res.json()

    assert data["status"] == "paid"
    assert data["pendingAmount"] == 0.0
    assert data["paidAmount"] == total_amount
    assert data["receiptNumber"] is not None

    # Check DB
    profile = db.query(Profile).filter(Profile.id == student_id).first()
    assert profile.fee_status == "paid"
    assert float(profile.fee_amount_due) == 0.0
