"""Wardens and confidential Warden Grievances router"""
import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.models.hostel import Warden, WardenGrievance

router = APIRouter(tags=["Wardens"])


class CreateGrievanceRequest(BaseModel):
    studentId: Optional[str] = None
    studentName: str = "Anonymous Student"
    studentEmail: Optional[str] = None
    studentPhone: Optional[str] = None
    roomNumber: Optional[str] = None
    blockName: Optional[str] = None
    wardenName: Optional[str] = None
    wardenId: Optional[str] = None
    category: str = "other"
    subject: str
    description: str
    adminNotes: Optional[str] = None


class UpdateGrievanceRequest(BaseModel):
    status: str
    adminNotes: Optional[str] = None


def format_grievance(g: WardenGrievance) -> dict:
    return {
        "id": g.id,
        "studentId": g.student_id or "",
        "studentName": g.student_name or "Anonymous Student",
        "studentEmail": g.student_email or "",
        "studentPhone": g.student_phone or "",
        "roomNumber": g.room_number or "",
        "blockName": g.block_name or "",
        "wardenName": g.warden_name or "",
        "wardenId": g.warden_id or "",
        "category": g.category or "other",
        "subject": g.subject,
        "description": g.description,
        "status": g.status,
        "adminNotes": g.admin_notes,
        "createdAt": g.created_at.isoformat() if g.created_at else datetime.now(timezone.utc).isoformat(),
        "updatedAt": g.updated_at.isoformat() if g.updated_at else datetime.now(timezone.utc).isoformat(),
    }


@router.get("/wardens")
@router.get("/api/wardens")
def get_wardens(db: Session = Depends(get_db)):
    wardens = db.query(Warden).all()
    if not wardens:
        # Provide default warden
        default_w = Warden(
            id="usr-warden-1",
            name="Prof. Rajesh K. Sharma",
            email="rajesh.sharma@hostelos.edu",
            phone="+91 98111 22334",
            assigned_block_id="blk-a",
            assigned_block_name="Block A (Newton)",
            designation="Senior Resident Warden",
            status="on_duty",
            avatar_url="https://api.dicebear.com/9.x/initials/svg?seed=Rajesh%20Sharma&backgroundColor=0284c7&textColor=ffffff",
        )
        try:
            db.add(default_w)
            db.commit()
            db.refresh(default_w)
            wardens = [default_w]
        except Exception:
            db.rollback()
            return [
                {
                    "id": "usr-warden-1",
                    "name": "Prof. Rajesh K. Sharma",
                    "email": "rajesh.sharma@hostelos.edu",
                    "phone": "+91 98111 22334",
                    "assignedBlockId": "blk-a",
                    "assignedBlockName": "Block A (Newton)",
                    "designation": "Senior Resident Warden",
                    "status": "on_duty",
                    "avatar": "https://api.dicebear.com/9.x/initials/svg?seed=Rajesh%20Sharma&backgroundColor=0284c7&textColor=ffffff",
                }
            ]

    return [
        {
            "id": w.id,
            "name": w.name,
            "email": w.email,
            "phone": w.phone,
            "assignedBlockId": w.assigned_block_id or "blk-a",
            "assignedBlockName": w.assigned_block_name or "Block A (Newton)",
            "designation": w.designation or "Senior Resident Warden",
            "status": w.status or "on_duty",
            "avatar": w.avatar_url,
        }
        for w in wardens
    ]


@router.get("/warden-grievances")
@router.get("/api/warden-grievances")
def get_warden_grievances(db: Session = Depends(get_db)):
    grievances = db.query(WardenGrievance).order_by(WardenGrievance.created_at.desc()).all()
    return [format_grievance(g) for g in grievances]


@router.post("/warden-grievances")
@router.post("/api/warden-grievances")
def create_warden_grievance(data: CreateGrievanceRequest, db: Session = Depends(get_db)):
    gid = f"grv-{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc)
    g = WardenGrievance(
        id=gid,
        student_id=data.studentId,
        student_name=data.studentName,
        student_email=data.studentEmail,
        student_phone=data.studentPhone,
        room_number=data.roomNumber,
        block_name=data.blockName,
        warden_name=data.wardenName,
        warden_id=data.wardenId,
        category=data.category,
        subject=data.subject,
        description=data.description,
        status="under_review",
        admin_notes=data.adminNotes,
        created_at=now,
        updated_at=now,
    )
    db.add(g)
    db.commit()
    db.refresh(g)
    return format_grievance(g)


@router.patch("/warden-grievances/{grievance_id}")
@router.patch("/api/warden-grievances/{grievance_id}")
def update_warden_grievance_status(
    grievance_id: str,
    data: UpdateGrievanceRequest,
    db: Session = Depends(get_db),
):
    g = db.query(WardenGrievance).filter(WardenGrievance.id == grievance_id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Grievance not found")
    g.status = data.status
    if data.adminNotes is not None:
        g.admin_notes = data.adminNotes
    g.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(g)
    return format_grievance(g)


@router.delete("/warden-grievances/{grievance_id}")
@router.delete("/api/warden-grievances/{grievance_id}")
def delete_warden_grievance(grievance_id: str, db: Session = Depends(get_db)):
    g = db.query(WardenGrievance).filter(WardenGrievance.id == grievance_id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Grievance not found")
    db.delete(g)
    db.commit()
    return {"success": True, "id": grievance_id}

