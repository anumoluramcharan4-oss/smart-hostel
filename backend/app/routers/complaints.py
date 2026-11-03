"""Complaints router for Smart Hostel"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from backend.app.db.session import get_db
from backend.app.models.hostel import Complaint, Profile, Staff

router = APIRouter(tags=["Complaints"])


class ComplaintCreate(BaseModel):
    title: str
    description: str
    category: str
    priority: Optional[str] = "medium"
    status: Optional[str] = "pending"
    student_id: Optional[str] = None
    student_name: Optional[str] = None
    room_number: Optional[str] = None
    block_name: Optional[str] = None


class ComplaintStatusUpdate(BaseModel):
    status: str
    note: Optional[str] = None
    assigned_to: Optional[str] = None
    priority: Optional[str] = None


@router.get("/staff")
@router.get("/api/staff")
def get_staff(trade: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Staff)
    if trade and trade != "all":
        query = query.filter(Staff.trade.ilike(f"%{trade.strip()}%"))
    staff_list = query.order_by(Staff.trade, Staff.name).all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "phone": s.phone,
            "trade": s.trade,
            "status": s.status,
            "role": s.trade,
            "specialty": s.trade,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        }
        for s in staff_list
    ]


@router.get("/complaints")
@router.get("/api/complaints")
def get_complaints(
    student_id: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    block_name: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Complaint)
    if student_id:
        query = query.filter(Complaint.student_id == student_id)
    if status and status != "all":
        query = query.filter(Complaint.status == status)
    if priority and priority != "all":
        query = query.filter(Complaint.priority == priority)
    if block_name and block_name != "all":
        query = query.filter(Complaint.block_name.ilike(f"%{block_name}%"))

    complaints = query.order_by(Complaint.created_at.desc()).all()
    return [
        {
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "category": c.category,
            "priority": c.priority,
            "status": c.status,
            "studentId": c.student_id,
            "studentName": c.student_name,
            "roomNumber": c.room_number,
            "blockName": c.block_name,
            "assignedTo": c.assigned_to,
            "resolutionNotes": c.resolution_notes,
            "timeline": c.timeline or [],
            "createdAt": c.created_at.isoformat() if c.created_at else "",
            "updatedAt": c.updated_at.isoformat() if c.updated_at else "",
        }
        for c in complaints
    ]


@router.post("/complaints")
@router.post("/api/complaints")
def create_complaint(payload: ComplaintCreate, db: Session = Depends(get_db)):
    import uuid
    now = datetime.now(timezone.utc)
    c_id = f"cmp-{str(uuid.uuid4())[:8]}"

    # Auto-resolve student name if missing
    student_name = payload.student_name
    if payload.student_id and not student_name:
        st = db.query(Profile).filter(Profile.id == payload.student_id).first()
        if st:
            student_name = st.full_name

    c = Complaint(
        id=c_id,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        priority=payload.priority or "medium",
        status=payload.status or "pending",
        student_id=payload.student_id,
        student_name=student_name or "Student Resident",
        room_number=payload.room_number,
        block_name=payload.block_name,
        timeline=[
            {
                "status": payload.status or "pending",
                "timestamp": now.isoformat(),
                "note": f"Complaint recorded: {payload.title}",
            }
        ],
        created_at=now,
        updated_at=now,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return {
        "id": c.id,
        "title": c.title,
        "description": c.description,
        "category": c.category,
        "priority": c.priority,
        "status": c.status,
        "studentId": c.student_id,
        "studentName": c.student_name,
        "roomNumber": c.room_number,
        "blockName": c.block_name,
        "createdAt": c.created_at.isoformat(),
        "updatedAt": c.updated_at.isoformat(),
        "timeline": c.timeline,
    }


@router.patch("/complaints/{complaint_id}/status")
@router.patch("/api/complaints/{complaint_id}/status")
def update_complaint_status(
    complaint_id: str,
    payload: ComplaintStatusUpdate,
    db: Session = Depends(get_db),
):
    c = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")

    now = datetime.now(timezone.utc)
    c.status = payload.status
    if payload.assigned_to:
        c.assigned_to = payload.assigned_to
    if payload.priority:
        c.priority = payload.priority
    c.updated_at = now

    tl = list(c.timeline or [])
    tl.append({
        "status": payload.status,
        "timestamp": now.isoformat(),
        "note": payload.note or f"Status updated to {payload.status}",
    })
    c.timeline = tl

    db.commit()
    db.refresh(c)
    return {
        "id": c.id,
        "title": c.title,
        "status": c.status,
        "assignedTo": c.assigned_to,
        "priority": c.priority,
        "timeline": c.timeline,
    }


@router.delete("/complaints/{complaint_id}")
@router.delete("/api/complaints/{complaint_id}")
def delete_complaint(complaint_id: str, db: Session = Depends(get_db)):
    c = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")
    db.delete(c)
    db.commit()
    return {"success": True, "message": f"Complaint {complaint_id} removed"}

