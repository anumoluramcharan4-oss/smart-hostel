from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, Header
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.inspection import Inspection, InspectionStatus
from backend.app.schemas.inspection import (
    InspectionScheduleCreate,
    InspectionExecutionSubmit,
    InspectionResponse,
    InspectionStats
)
from backend.app.services.inspection_service import InspectionService

router = APIRouter(prefix="/inspections", tags=["Room Inspection & Cleanliness"])

def get_current_user_role(x_user_role: Optional[str] = Header(None, alias="X-User-Role")) -> str:
    return (x_user_role or "warden").lower()

@router.get("/stats", response_model=InspectionStats)
def get_inspection_stats(db: Session = Depends(get_db)):
    return InspectionService.get_stats(db)

@router.get("", response_model=List[InspectionResponse])
def list_inspections(
    block: Optional[str] = None,
    room_number: Optional[str] = None,
    status: Optional[InspectionStatus] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Inspection)
    if block and block != "all":
        query = query.filter(Inspection.block == block)
    if room_number:
        query = query.filter(Inspection.room_number == room_number)
    if status:
        query = query.filter(Inspection.status == status)

    return query.order_by(Inspection.created_at.desc()).all()

@router.post("/schedule", response_model=InspectionResponse)
def schedule_inspection(
    data: InspectionScheduleCreate,
    db: Session = Depends(get_db),
    role: str = Depends(get_current_user_role)
):
    if role not in ["admin", "warden"]:
        raise HTTPException(status_code=403, detail="Forbidden: Only admin or warden can schedule room inspections")
    return InspectionService.schedule_inspection(db, data)

@router.post("/{inspection_id}/submit", response_model=InspectionResponse)
def submit_inspection(
    inspection_id: str,
    submission: InspectionExecutionSubmit,
    db: Session = Depends(get_db),
    role: str = Depends(get_current_user_role)
):
    if role not in ["admin", "warden", "staff"]:
        raise HTTPException(status_code=403, detail="Forbidden: Only authorized inspectors can submit inspection results")
    return InspectionService.submit_execution(db, inspection_id, submission)
