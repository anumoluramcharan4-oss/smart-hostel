"""Students router with floor filtering, search, fee status, and unallocated students"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.models.hostel import Profile, Room, FeeRecord

router = APIRouter(tags=["Students"])


def extract_floor(room_number: Optional[str]) -> Optional[int]:
    if not room_number:
        return None
    cleaned = room_number.upper().replace("A-", "").strip()
    if cleaned and cleaned[0].isdigit():
        return int(cleaned[0])
    return None


@router.get("/profiles/demo")
@router.get("/api/profiles/demo")
def get_demo_profiles(db: Session = Depends(get_db)):
    admin = db.query(Profile).filter(Profile.role == "admin").first()
    warden = db.query(Profile).filter(Profile.role == "warden").first()

    pending_student = (
        db.query(Profile)
        .filter(Profile.id == "usr-student-2")
        .first()
    )
    if not pending_student or pending_student.fee_status != "pending":
        pending_student = (
            db.query(Profile)
            .join(FeeRecord, FeeRecord.student_id == Profile.id)
            .filter(Profile.role == "student", FeeRecord.status == "pending")
            .order_by(Profile.id)
            .first()
        )
    partial_student = (
        db.query(Profile)
        .filter(Profile.id == "usr-student-4")
        .first()
    )
    if not partial_student or partial_student.fee_status != "partial":
        partial_student = (
            db.query(Profile)
            .join(FeeRecord, FeeRecord.student_id == Profile.id)
            .filter(Profile.role == "student", FeeRecord.status == "partial")
            .order_by(Profile.id)
            .first()
        )
    paid_student = (
        db.query(Profile)
        .filter(Profile.id == "usr-student-1")
        .first()
    )
    if not paid_student or paid_student.fee_status != "paid":
        paid_student = (
            db.query(Profile)
            .join(FeeRecord, FeeRecord.student_id == Profile.id)
            .filter(Profile.role == "student", FeeRecord.status == "paid")
            .order_by(Profile.id)
            .first()
        )

    def format_user(p: Optional[Profile], fallback_role: str = "student"):
        if not p:
            return None
        return {
            "id": p.id,
            "name": p.full_name,
            "email": p.email,
            "role": p.role or fallback_role,
            "avatar": p.avatar_url or f"https://api.dicebear.com/9.x/initials/svg?seed={p.full_name}&backgroundColor=0284c7&textColor=ffffff",
            "phone": p.phone or "",
            "roomNumber": p.room_number or "",
            "blockName": p.block_name or "Block A (Newton)",
            "bedNumber": p.bed_number or "",
            "course": p.course or "B.Tech CSE",
            "year": p.year or 1,
            "rollNo": p.roll_no or "",
            "feeStatus": p.fee_status or "paid",
            "feeAmountDue": float(p.fee_amount_due or 0),
            "attendancePercent": float(p.attendance_percent or 95),
            "guardianName": p.guardian_name or "",
            "guardianPhone": p.guardian_phone or "",
        }

    return {
        "admin": format_user(admin, "admin"),
        "warden": format_user(warden, "warden"),
        "students": {
            "pending": format_user(pending_student, "student"),
            "partial": format_user(partial_student, "student"),
            "paid": format_user(paid_student, "student"),
        },
        "defaultStudent": format_user(pending_student, "student"),
    }


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
            "floor": extract_floor(s.room_number),
            "blockName": s.block_name or "",
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
        "floor": extract_floor(s.room_number),
        "blockName": s.block_name or "",
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

