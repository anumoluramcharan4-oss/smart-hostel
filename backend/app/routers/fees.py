"""Fee Management router for Smart Hostel"""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.hostel import FeeRecord, PaymentTransaction

router = APIRouter(tags=["Fees"])


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
    return [
        {
            "id": f.id,
            "studentId": f.student_id,
            "studentName": f.student_name,
            "rollNo": f.roll_no,
            "roomNumber": f.room_number,
            "term": f.term,
            "amount": float(f.total_amount),
            "paidAmount": float(f.paid_amount),
            "pendingAmount": float(f.pending_amount),
            "status": f.status,
            "dueDate": f.due_date,
            "createdAt": f.created_at.isoformat() if f.created_at else "",
        }
        for f in fees
    ]


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

