from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, Header
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.parcel import Parcel, ParcelStatus, ParcelPickupCode
from backend.app.schemas.parcel import (
    ParcelCreate,
    ParcelResponse,
    StudentParcelResponse,
    ParcelPickupVerification,
    ParcelStats
)
from backend.app.services.parcel_service import ParcelService

router = APIRouter(prefix="/parcels", tags=["Parcel & Delivery Management"])

def get_current_user_role(x_user_role: Optional[str] = Header(None, alias="X-User-Role")) -> str:
    return (x_user_role or "admin").lower()

def get_current_user_id(x_user_id: Optional[str] = Header(None, alias="X-User-Id")) -> str:
    return x_user_id or "STU101"

@router.get("/stats", response_model=ParcelStats)
def get_parcel_stats(db: Session = Depends(get_db)):
    return ParcelService.get_stats(db)

@router.get("", response_model=List[ParcelResponse])
def list_parcels(
    status: Optional[ParcelStatus] = None,
    student_id: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    role: str = Depends(get_current_user_role)
):
    query = db.query(Parcel)
    if status:
        query = query.filter(Parcel.status == status)
    if student_id:
        query = query.filter(Parcel.recipient_student_id == student_id)
    if search:
        query = query.filter(
            (Parcel.parcel_ref.ilike(f"%{search}%")) |
            (Parcel.recipient_name.ilike(f"%{search}%")) |
            (Parcel.courier.ilike(f"%{search}%")) |
            (Parcel.tracking_number.ilike(f"%{search}%"))
        )
    return query.order_by(Parcel.created_at.desc()).all()

@router.get("/student/my-parcels", response_model=List[StudentParcelResponse])
def get_student_parcels(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    """Students can only inspect their own parcels and retrieve active secret pickup codes."""
    parcels = db.query(Parcel).filter(Parcel.recipient_student_id == user_id).order_by(Parcel.created_at.desc()).all()
    results = []
    for p in parcels:
        active_code = None
        if p.status == ParcelStatus.AWAITING_COLLECTION:
            code_obj = db.query(ParcelPickupCode).filter(
                ParcelPickupCode.parcel_id == p.id,
                ParcelPickupCode.used == "FALSE"
            ).order_by(ParcelPickupCode.created_at.desc()).first()
            if code_obj:
                active_code = code_obj.code
        
        resp = StudentParcelResponse.model_validate(p)
        resp.active_pickup_code = active_code
        results.append(resp)
    return results

@router.post("", response_model=ParcelResponse)
def register_parcel(
    data: ParcelCreate,
    db: Session = Depends(get_db),
    role: str = Depends(get_current_user_role)
):
    if role not in ["admin", "warden", "security", "staff"]:
        raise HTTPException(status_code=403, detail="Forbidden: Only hostel staff can register parcels")
    return ParcelService.register_parcel(db, data, staff_name=f"{role.capitalize()} Desk")

@router.post("/verify-collect", response_model=ParcelResponse)
def verify_and_collect_parcel(
    verification: ParcelPickupVerification,
    db: Session = Depends(get_db)
):
    return ParcelService.verify_and_collect(db, verification)
