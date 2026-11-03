"""Students router with floor filtering, search, fee status, and unallocated students"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.models.hostel import Profile, Room

router = APIRouter(tags=["Students"])


@router.get("/students")
@router.get("/api/students")
def get_students(
    floor: Optional[int] = Query(None, description="Filter by floor (1-5)"),
    search: Optional[str] = Query(None, description="Search by name, roll no, or room"),
    fee_status: Optional[str] = Query(None, description="Fee status (paid, pending, partial)"),
    block: Optional[str] = Query(None, description="Block filter"),
    unallocated_only: Optional[bool] = Query(False, description="Filter only unallocated students"),
    db: Session = Depends(get_db),
):
    query = db.query(Profile).filter(Profile.role == "student")

    if unallocated_only:
        query = query.filter((Profile.room_number == None) | (Profile.room_number == ""))
    elif floor is not None and floor > 0:
        query = query.join(Room, Profile.room_number == Room.number).filter(Room.floor == floor)

    if fee_status and fee_status != "all":
        query = query.filter(Profile.fee_status == fee_status)

    if block and block != "all":
        query = query.filter(Profile.block_name.ilike(f"%{block}%"))

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            Profile.full_name.ilike(s) | Profile.roll_no.ilike(s) | Profile.room_number.ilike(s)
        )

    students = query.order_by(Profile.roll_no).all()
    return [
        {
            "id": s.id,
            "name": s.full_name or "Student",
            "rollNo": s.roll_no or "",
            "email": s.email or "",
            "phone": s.phone or "",
            "roomNumber": s.room_number or "",
            "blockName": s.block_name or "Block A (Newton)",
            "bedNumber": s.bed_number or "",
            "course": s.course or "B.Tech CSE",
            "year": s.year or 1,
            "feeStatus": s.fee_status or "paid",
            "feeAmountDue": float(s.fee_amount_due or 0),
            "attendancePercent": float(s.attendance_percent or 95),
            "avatar": s.avatar_url
            or f"https://api.dicebear.com/9.x/initials/svg?seed={s.full_name or 'User'}&backgroundColor=0284c7&textColor=ffffff",
            "guardianName": s.guardian_name or "",
            "guardianPhone": s.guardian_phone or "",
            "joinDate": "2024-08-01",
        }
        for s in students
    ]


@router.get("/students/unallocated")
@router.get("/api/students/unallocated")
def get_unallocated_students(db: Session = Depends(get_db)):
    students = (
        db.query(Profile)
        .filter(Profile.role == "student")
        .filter((Profile.room_number == None) | (Profile.room_number == ""))
        .order_by(Profile.full_name)
        .all()
    )
    return [
        {
            "id": s.id,
            "name": s.full_name or "Student",
            "rollNo": s.roll_no or "",
            "email": s.email or "",
            "phone": s.phone or "",
            "roomNumber": "",
            "blockName": "",
            "bedNumber": "",
            "course": s.course or "B.Tech CSE",
            "year": s.year or 1,
            "feeStatus": s.fee_status or "paid",
            "feeAmountDue": float(s.fee_amount_due or 0),
            "attendancePercent": float(s.attendance_percent or 95),
            "avatar": s.avatar_url or "",
        }
        for s in students
    ]


@router.get("/students/{student_id}")
@router.get("/api/students/{student_id}")
def get_student(student_id: str, db: Session = Depends(get_db)):
    s = db.query(Profile).filter(Profile.id == student_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Student not found")
    return {
        "id": s.id,
        "name": s.full_name or "Student",
        "rollNo": s.roll_no or "",
        "email": s.email or "",
        "phone": s.phone or "",
        "roomNumber": s.room_number or "",
        "blockName": s.block_name or "Block A (Newton)",
        "bedNumber": s.bed_number or "",
        "course": s.course or "B.Tech CSE",
        "year": s.year or 1,
        "feeStatus": s.fee_status or "paid",
        "feeAmountDue": float(s.fee_amount_due or 0),
        "attendancePercent": float(s.attendance_percent or 95),
        "avatar": s.avatar_url or "",
        "guardianName": s.guardian_name or "",
        "guardianPhone": s.guardian_phone or "",
        "joinDate": "2024-08-01",
    }

