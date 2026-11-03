"""Fee Management router for Smart Hostel"""
import random
import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.hostel import FeeRecord, PaymentTransaction, Profile

router = APIRouter(tags=["Fees"])


class PayFeeRequest(BaseModel):
    mode: str = "Online Gateway (UPI)"
    student_id: Optional[str] = None


@router.get("/fees")
@router.get("/api/fees")
def get_fees(
    student_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(FeeRecord)
    if student_id:
        query = query.filter(FeeRecord.student_id == student_id)
    if status and status != "all":
        query = query.filter(FeeRecord.status == status)

    fees = query.order_by(FeeRecord.room_number).all()
    if not fees:
        return []

    fee_ids = [f.id for f in fees]
    # Fetch payment transactions for these fees, ordered by paid_at desc
    txs = (
        db.query(PaymentTransaction)
        .filter(PaymentTransaction.fee_id.in_(fee_ids))
        .order_by(PaymentTransaction.paid_at.desc())
        .all()
    )
    latest_tx_map = {}
    for tx in txs:
        if tx.fee_id not in latest_tx_map:
            latest_tx_map[tx.fee_id] = tx

    return [
        {
            "id": f.id,
            "studentId": f.student_id,
            "studentName": f.student_name,
            "rollNo": f.roll_no,
            "roomNumber": f.room_number,
            "title": "Hostel Fee",
            "semester": f.term or "Term 1, Autumn 2026-2027",
            "term": f.term,
            "amount": float(f.total_amount),
            "paidAmount": float(f.paid_amount),
            "pendingAmount": float(f.pending_amount),
            "status": f.status,
            "dueDate": f.due_date,
            "paidDate": latest_tx_map[f.id].paid_at.strftime("%Y-%m-%d")
            if (f.id in latest_tx_map and latest_tx_map[f.id].paid_at)
            else None,
            "receiptNumber": latest_tx_map[f.id].transaction_ref
            if f.id in latest_tx_map
            else None,
            "mode": latest_tx_map[f.id].payment_method
            if f.id in latest_tx_map
            else None,
            "createdAt": f.created_at.isoformat() if f.created_at else "",
        }
        for f in fees
    ]


@router.post("/fees/{fee_id}/pay")
@router.post("/api/fees/{fee_id}/pay")
def pay_fee(
    fee_id: str,
    req: PayFeeRequest,
    db: Session = Depends(get_db),
):
    try:
        fee = db.query(FeeRecord).filter(FeeRecord.id == fee_id).first()
        if not fee:
            raise HTTPException(status_code=404, detail="Fee record not found")

        # 403 if optional student_id does not match fee's student_id
        if req.student_id and req.student_id != fee.student_id:
            raise HTTPException(status_code=403, detail="Student ID does not match fee record")

        # 400 "Already paid" if status is paid
        if fee.status == "paid" or float(fee.pending_amount) <= 0:
            raise HTTPException(status_code=400, detail="Already paid")

        amount_to_pay = float(fee.pending_amount)
        new_paid_amount = float(fee.paid_amount) + amount_to_pay

        # Update fee record in the same transaction
        fee.paid_amount = new_paid_amount
        fee.pending_amount = 0.0
        fee.status = "paid"

        # Generate unique transaction reference like TXN-<year>-<random>
        year = datetime.now().year
        rand_suffix = f"{random.randint(1000, 9999)}"
        txn_ref = f"TXN-{year}-{rand_suffix}"
        while db.query(PaymentTransaction).filter(PaymentTransaction.transaction_ref == txn_ref).first():
            rand_suffix = f"{random.randint(10000, 99999)}"
            txn_ref = f"TXN-{year}-{rand_suffix}"

        now_dt = datetime.now(timezone.utc)
        txn = PaymentTransaction(
            id=f"tx-{uuid.uuid4().hex[:8]}",
            fee_id=fee.id,
            student_id=fee.student_id,
            amount=amount_to_pay,
            payment_method=req.mode,
            transaction_ref=txn_ref,
            paid_at=now_dt,
        )
        db.add(txn)

        # Update student Profile in the same transaction
        profile = db.query(Profile).filter(Profile.id == fee.student_id).first()
        if profile:
            profile.fee_status = "paid"
            profile.fee_amount_due = 0.0

        db.commit()
        db.refresh(fee)

        paid_date = txn.paid_at.strftime("%Y-%m-%d")
        return {
            "id": fee.id,
            "studentId": fee.student_id,
            "studentName": fee.student_name,
            "rollNo": fee.roll_no,
            "roomNumber": fee.room_number,
            "title": "Hostel Fee",
            "semester": fee.term or "Term 1, Autumn 2026-2027",
            "term": fee.term,
            "amount": float(fee.total_amount),
            "paidAmount": float(fee.paid_amount),
            "pendingAmount": float(fee.pending_amount),
            "dueDate": fee.due_date,
            "paidDate": paid_date,
            "status": fee.status,
            "receiptNumber": txn.transaction_ref,
            "mode": txn.payment_method,
            "createdAt": fee.created_at.isoformat() if fee.created_at else "",
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/payments")
@router.get("/api/payments")
def get_payments(db: Session = Depends(get_db)):
    txs = db.query(PaymentTransaction).order_by(PaymentTransaction.paid_at.desc()).all()
    return [
        {
            "id": t.id,
            "feeId": t.fee_id,
            "studentId": t.student_id,
            "amount": float(t.amount),
            "paymentMethod": t.payment_method,
            "transactionRef": t.transaction_ref,
            "paidAt": t.paid_at.isoformat() if t.paid_at else "",
        }
        for t in txs
    ]

