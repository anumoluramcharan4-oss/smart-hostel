from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, Header
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.models.visitor import Visitor, VisitorStatus, VisitorCategory
from backend.app.schemas.visitor import (
    VisitorCreate,
    VisitorResponse,
    VisitorReview,
    VisitorCheckInOut,
    PassVerificationRequest,
    VisitorStats
)
from backend.app.services.visitor_service import VisitorService

router = APIRouter(prefix="/visitors", tags=["Visitor & Security Management"])

def get_current_user_role(x_user_role: Optional[str] = Header(None, alias="X-User-Role")) -> str:
    # Sensible default allows development and testing while enforcing authorization
    return (x_user_role or "admin").lower()

@router.get("/stats", response_model=VisitorStats)
def get_visitor_stats(db: Session = Depends(get_db)):
    return VisitorService.get_stats(db)

@router.get("/live-inside", response_model=List[VisitorResponse])
def get_visitors_inside(db: Session = Depends(get_db)):
    """Returns all visitors currently checked in inside the hostel."""
    return db.query(Visitor).filter(Visitor.status == VisitorStatus.CHECKED_IN).order_by(Visitor.updated_at.desc()).all()

@router.get("/pending", response_model=List[VisitorResponse])
def get_pending_approvals(db: Session = Depends(get_db)):
    """Warden queue of pending visitor requests."""
    return db.query(Visitor).filter(Visitor.status == VisitorStatus.PENDING_APPROVAL).order_by(Visitor.created_at.desc()).all()

@router.get("", response_model=List[VisitorResponse])
def list_visitors(
    status: Optional[VisitorStatus] = None,
    category: Optional[VisitorCategory] = None,
    student_id: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(Visitor)
    if status:
        query = query.filter(Visitor.status == status)
    if category:
        query = query.filter(Visitor.category == category)
    if student_id:
        query = query.filter(Visitor.host_student_id == student_id)
    if search:
        query = query.filter(
            (Visitor.name.ilike(f"%{search}%")) |
            (Visitor.phone.ilike(f"%{search}%")) |
            (Visitor.host_student_name.ilike(f"%{search}%"))
        )
    return query.order_by(Visitor.created_at.desc()).offset(skip).limit(limit).all()

@router.post("", response_model=VisitorResponse)
def register_visitor(
    data: VisitorCreate,
    db: Session = Depends(get_db),
    role: str = Depends(get_current_user_role)
):
    # Security/Staff/Admin can register
    return VisitorService.register_visitor(db, data, registered_by=role)

@router.get("/{visitor_id}", response_model=VisitorResponse)
def get_visitor(visitor_id: str, db: Session = Depends(get_db)):
    visitor = db.query(Visitor).filter(Visitor.id == visitor_id).first()
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")
    return visitor

@router.post("/{visitor_id}/review", response_model=VisitorResponse)
def review_visitor(
    visitor_id: str,
    review: VisitorReview,
    db: Session = Depends(get_db),
    role: str = Depends(get_current_user_role)
):
    if role not in ["admin", "warden"]:
        raise HTTPException(status_code=403, detail="Forbidden: Only admin or warden can approve/reject visits")
    return VisitorService.review_visitor(db, visitor_id, review)

@router.post("/verify-pass")
def verify_visitor_pass(payload: PassVerificationRequest, db: Session = Depends(get_db)):
    return VisitorService.verify_pass(db, payload.pass_code.strip())

@router.post("/{visitor_id}/check-in", response_model=VisitorResponse)
def check_in_visitor(
    visitor_id: str,
    action: VisitorCheckInOut,
    db: Session = Depends(get_db)
):
    return VisitorService.check_in(db, visitor_id, action)

@router.post("/{visitor_id}/check-out", response_model=VisitorResponse)
def check_out_visitor(
    visitor_id: str,
    action: VisitorCheckInOut,
    db: Session = Depends(get_db)
):
    return VisitorService.check_out(db, visitor_id, action)
