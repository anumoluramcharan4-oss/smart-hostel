from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, Header
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.laundry import LaundryOrder, LaundryRate, LaundryOrderStatus
from backend.app.schemas.laundry import (
    LaundryOrderCreate,
    LaundryOrderResponse,
    LaundryCountConfirmation,
    LaundryStatusUpdate,
    LaundryRateResponse,
    LaundryStats
)
from backend.app.services.laundry_service import LaundryService

router = APIRouter(prefix="/laundry", tags=["Laundry Management"])

def get_current_user_role(x_user_role: Optional[str] = Header(None, alias="X-User-Role")) -> str:
    return (x_user_role or "student").lower()

def get_current_user_id(x_user_id: Optional[str] = Header(None, alias="X-User-Id")) -> str:
    return x_user_id or "STU101"

@router.get("/stats", response_model=LaundryStats)
def get_laundry_stats(db: Session = Depends(get_db)):
    return LaundryService.get_stats(db)

@router.get("/rates", response_model=List[LaundryRateResponse])
def get_laundry_rates(db: Session = Depends(get_db)):
    return LaundryService.get_rates(db)

@router.get("", response_model=List[LaundryOrderResponse])
def list_orders(
    status: Optional[LaundryOrderStatus] = None,
    student_id: Optional[str] = None,
    db: Session = Depends(get_db),
    role: str = Depends(get_current_user_role),
    user_id: str = Depends(get_current_user_id)
):
    query = db.query(LaundryOrder)
    # Student isolation: regular students can only see their own orders
    if role == "student":
        query = query.filter(LaundryOrder.student_id == user_id)
    elif student_id:
        query = query.filter(LaundryOrder.student_id == student_id)

    if status:
        query = query.filter(LaundryOrder.status == status)

    return query.order_by(LaundryOrder.created_at.desc()).all()

@router.post("/book", response_model=LaundryOrderResponse)
def book_laundry_order(
    data: LaundryOrderCreate,
    db: Session = Depends(get_db)
):
    return LaundryService.book_order(db, data)

@router.post("/{order_id}/confirm-counts", response_model=LaundryOrderResponse)
def confirm_order_counts(
    order_id: str,
    confirmation: LaundryCountConfirmation,
    db: Session = Depends(get_db),
    role: str = Depends(get_current_user_role)
):
    if role not in ["admin", "warden", "staff"]:
        raise HTTPException(status_code=403, detail="Forbidden: Only staff can verify intake counts")
    return LaundryService.confirm_item_counts(db, order_id, confirmation)

@router.post("/{order_id}/status", response_model=LaundryOrderResponse)
def update_order_status(
    order_id: str,
    update: LaundryStatusUpdate,
    db: Session = Depends(get_db),
    role: str = Depends(get_current_user_role)
):
    if role not in ["admin", "warden", "staff"]:
        raise HTTPException(status_code=403, detail="Forbidden: Only staff can advance order lifecycle")
    return LaundryService.update_status(db, order_id, update)
