"""Rooms router with floor filtering, allocate, and deallocate operations"""
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from backend.app.db.session import get_db
from backend.app.models.hostel import Room, Profile, Allocation, Block, AllocationHistory

router = APIRouter(tags=["Rooms"])


class AllocationRequest(BaseModel):
    student_id: str
    bed_number: Optional[str] = None
    bed: Optional[str] = None


class DeallocationRequest(BaseModel):
    student_id: str
    reason: Optional[str] = None


class TransferRequest(BaseModel):
    student_id: str
    target_room_id: str
    target_bed_number: str
    reason: Optional[str] = None


@router.get("/rooms")
@router.get("/api/rooms")
def get_rooms(
    floor: Optional[int] = Query(None, description="Floor number (1-5)"),
    block_id: Optional[str] = Query(None, description="Block ID"),
    status: Optional[str] = Query(None, description="Room status"),
    db: Session = Depends(get_db),
):
    query = db.query(Room)
    if floor is not None and floor > 0:
        query = query.filter(Room.floor == floor)
    if block_id and block_id != "all":
        query = query.filter(Room.block_id == block_id)
    if status and status != "all":
        query = query.filter(Room.status == status)

    rooms = query.order_by(Room.number).all()
    return [
        {
            "id": r.id,
            "number": r.number,
            "blockId": r.block_id,
            "blockName": r.block_name or "",
            "floor": r.floor,
            "type": r.type or "quad",
            "capacity": r.capacity or 4,
            "occupied": r.occupied or 0,
            "status": r.status or "available",
            "amenities": r.amenities or [],
            "occupants": r.occupants or [],
        }
        for r in rooms
    ]


@router.get("/rooms/{room_id}")
@router.get("/api/rooms/{room_id}")
def get_room(room_id: str, db: Session = Depends(get_db)):
    room = db.query(Room).filter((Room.id == room_id) | (Room.number == room_id)).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return {
        "id": room.id,
        "number": room.number,
        "blockId": room.block_id,
        "blockName": room.block_name or "",
        "floor": room.floor,
        "type": room.type or "quad",
        "capacity": room.capacity or 4,
        "occupied": room.occupied or 0,
        "status": room.status or "available",
        "amenities": room.amenities or [],
        "occupants": room.occupants or [],
    }


@router.post("/rooms/{room_id}/allocate")
@router.post("/api/rooms/{room_id}/allocate")
def allocate_room(
    room_id: str,
    payload: AllocationRequest,
    db: Session = Depends(get_db),
):
    room = db.query(Room).filter((Room.id == room_id) | (Room.number == room_id)).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    student = db.query(Profile).filter(Profile.id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Check if student is already actively allocated
    existing_alloc = db.query(Allocation).filter(
        Allocation.student_id == student.id,
        Allocation.is_active == True,
    ).first()
    if existing_alloc:
        raise HTTPException(
            status_code=400,
            detail=f"Student {student.full_name} already has an active allocation ({existing_alloc.room_number} {existing_alloc.bed_number}). Deallocate or transfer first."
        )

    target_bed = payload.bed_number or payload.bed or "Bed 1"

    # Check if room is already at full capacity
    if room.occupied >= (room.capacity or 4):
        raise HTTPException(status_code=400, detail=f"Room {room.number} is full ({room.capacity}/{room.capacity} occupied)")

    # Check if this specific bed in this room is already occupied
    bed_alloc = db.query(Allocation).filter(
        Allocation.room_number == room.number,
        Allocation.bed_number == target_bed,
        Allocation.is_active == True,
    ).first()
    if bed_alloc:
        raise HTTPException(status_code=400, detail=f"{target_bed} in Room {room.number} is already occupied")

    # Create new allocation record
    new_alloc = Allocation(
        id=f"alloc-{uuid_gen()}",
        student_id=student.id,
        room_id=room.id,
        room_number=room.number,
        bed_number=target_bed,
        is_active=True,
    )
    db.add(new_alloc)

    # Update student profile
    student.room_number = room.number
    student.bed_number = target_bed
    student.block_name = room.block_name

    # Update room occupants
    current_occupants = [o for o in (room.occupants or []) if o.get("id") != student.id]
    current_occupants.append({
        "id": student.id,
        "name": student.full_name,
        "rollNo": student.roll_no or "",
        "bed": target_bed,
        "course": student.course or "",
        "avatar": student.avatar_url or "",
    })

    room.occupants = current_occupants
    room.occupied = len(current_occupants)
    room.status = "occupied" if room.occupied >= (room.capacity or 4) else "available"

    # Record in Allocation History
    hist = AllocationHistory(
        id=f"hist-alloc-{uuid_gen()}",
        student_id=student.id,
        student_name=student.full_name,
        student_roll=student.roll_no,
        room_number=room.number,
        bed_number=target_bed,
        action="allocate",
        performed_by="admin",
        reason="Allocated by Administrator",
        created_at=datetime.now(timezone.utc),
    )
    db.add(hist)

    # Update block occupied count
    block = db.query(Block).filter(Block.id == room.block_id).first()
    if block:
        total_occ = db.query(Allocation).filter(Allocation.is_active == True).count()
        block.occupied = total_occ

    db.commit()
    db.refresh(room)

    return {
        "id": room.id,
        "number": room.number,
        "blockId": room.block_id,
        "blockName": room.block_name or "",
        "floor": room.floor,
        "type": room.type or "quad",
        "capacity": room.capacity or 4,
        "occupied": room.occupied or 0,
        "status": room.status or "available",
        "amenities": room.amenities or [],
        "occupants": room.occupants or [],
    }


@router.post("/rooms/{room_id}/deallocate")
@router.post("/api/rooms/{room_id}/deallocate")
def deallocate_room(
    room_id: str,
    payload: DeallocationRequest,
    db: Session = Depends(get_db),
):
    room = db.query(Room).filter((Room.id == room_id) | (Room.number == room_id)).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    student = db.query(Profile).filter(Profile.id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Mark allocation inactive
    active_allocs = db.query(Allocation).filter(
        Allocation.student_id == student.id,
        Allocation.is_active == True,
    ).all()
    for a in active_allocs:
        a.is_active = False
        a.deallocated_at = datetime.now(timezone.utc)

    # Clear student room and bed
    student.room_number = None
    student.bed_number = None

    # Remove student from room occupants list
    old_bed = student.bed_number or "Bed"
    new_occupants = [o for o in (room.occupants or []) if o.get("id") != student.id]
    room.occupants = new_occupants
    room.occupied = len(new_occupants)
    room.status = "available"

    # Record in Allocation History
    hist = AllocationHistory(
        id=f"hist-dealloc-{uuid_gen()}",
        student_id=student.id,
        student_name=student.full_name,
        student_roll=student.roll_no,
        room_number=room.number,
        bed_number=old_bed,
        action="deallocate",
        performed_by="admin",
        reason=payload.reason or "Deallocated by Administrator",
        created_at=datetime.now(timezone.utc),
    )
    db.add(hist)

    # Update block occupied count
    block = db.query(Block).filter(Block.id == room.block_id).first()
    if block:
        total_occ = db.query(Allocation).filter(Allocation.is_active == True).count()
        block.occupied = total_occ

    db.commit()
    db.refresh(room)

    return {
        "id": room.id,
        "number": room.number,
        "blockId": room.block_id,
        "blockName": room.block_name or "",
        "floor": room.floor,
        "type": room.type or "quad",
        "capacity": room.capacity or 4,
        "occupied": room.occupied or 0,
        "status": room.status or "available",
        "amenities": room.amenities or [],
        "occupants": room.occupants or [],
    }


@router.post("/rooms/{room_id}/transfer")
@router.post("/api/rooms/{room_id}/transfer")
def transfer_room(
    room_id: str,
    payload: TransferRequest,
    db: Session = Depends(get_db),
):
    source_room = db.query(Room).filter((Room.id == room_id) | (Room.number == room_id)).first()
    if not source_room:
        raise HTTPException(status_code=404, detail="Source room not found")

    target_room = db.query(Room).filter((Room.id == payload.target_room_id) | (Room.number == payload.target_room_id)).first()
    if not target_room:
        raise HTTPException(status_code=404, detail="Target room not found")

    student = db.query(Profile).filter(Profile.id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Check if target bed is occupied
    target_bed_occupied = db.query(Allocation).filter(
        Allocation.room_number == target_room.number,
        Allocation.bed_number == payload.target_bed_number,
        Allocation.is_active == True,
    ).first()
    if target_bed_occupied and target_bed_occupied.student_id != student.id:
        raise HTTPException(status_code=400, detail=f"{payload.target_bed_number} in Room {target_room.number} is already occupied")

    # Atomic transfer in single transaction
    # 1. End old active allocations
    old_allocs = db.query(Allocation).filter(
        Allocation.student_id == student.id,
        Allocation.is_active == True,
    ).all()
    for a in old_allocs:
        a.is_active = False
        a.deallocated_at = datetime.now(timezone.utc)

    # 2. Remove from source room occupants
    source_occupants = [o for o in (source_room.occupants or []) if o.get("id") != student.id]
    source_room.occupants = source_occupants
    source_room.occupied = len(source_occupants)
    source_room.status = "available"

    # 3. Create new allocation
    new_alloc = Allocation(
        id=f"alloc-{uuid_gen()}",
        student_id=student.id,
        room_id=target_room.id,
        room_number=target_room.number,
        bed_number=payload.target_bed_number,
        is_active=True,
    )
    db.add(new_alloc)

    # 4. Add to target room occupants
    target_occupants = [o for o in (target_room.occupants or []) if o.get("id") != student.id]
    target_occupants.append({
        "id": student.id,
        "name": student.full_name,
        "rollNo": student.roll_no or "",
        "bed": payload.target_bed_number,
        "course": student.course or "",
        "avatar": student.avatar_url or "",
    })
    target_room.occupants = target_occupants
    target_room.occupied = len(target_occupants)
    target_room.status = "occupied" if target_room.occupied >= (target_room.capacity or 4) else "available"

    # 5. Update student profile
    student.room_number = target_room.number
    student.bed_number = payload.target_bed_number
    student.block_name = target_room.block_name

    # 6. Record transfer in AllocationHistory
    hist = AllocationHistory(
        id=f"hist-trans-{uuid_gen()}",
        student_id=student.id,
        student_name=student.full_name,
        student_roll=student.roll_no,
        room_number=f"{source_room.number} -> {target_room.number}",
        bed_number=payload.target_bed_number,
        action="transfer",
        performed_by="admin",
        reason=payload.reason or f"Transferred from {source_room.number} to {target_room.number}",
        created_at=datetime.now(timezone.utc),
    )
    db.add(hist)

    db.commit()
    db.refresh(source_room)
    db.refresh(target_room)

    return {
        "success": True,
        "sourceRoom": {
            "id": source_room.id,
            "number": source_room.number,
            "occupied": source_room.occupied,
            "capacity": source_room.capacity,
            "occupants": source_room.occupants,
        },
        "targetRoom": {
            "id": target_room.id,
            "number": target_room.number,
            "occupied": target_room.occupied,
            "capacity": target_room.capacity,
            "occupants": target_room.occupants,
        },
        "student": {
            "id": student.id,
            "name": student.full_name,
            "roomNumber": student.room_number,
            "bedNumber": student.bed_number,
        }
    }


@router.get("/rooms/{room_id}/history")
@router.get("/api/rooms/{room_id}/history")
def get_room_history(room_id: str, db: Session = Depends(get_db)):
    room = db.query(Room).filter((Room.id == room_id) | (Room.number == room_id)).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    history = db.query(AllocationHistory).filter(
        (AllocationHistory.room_number == room.number) |
        (AllocationHistory.room_number.contains(room.number))
    ).order_by(AllocationHistory.created_at.desc()).all()
    return [
        {
            "id": h.id,
            "studentId": h.student_id,
            "studentName": h.student_name,
            "studentRoll": h.student_roll,
            "roomNumber": h.room_number,
            "bedNumber": h.bed_number,
            "action": h.action,
            "performedBy": h.performed_by,
            "reason": h.reason,
            "timestamp": h.created_at.isoformat() if h.created_at else "",
        }
        for h in history
    ]


def uuid_gen() -> str:
    import uuid
    return str(uuid.uuid4())
