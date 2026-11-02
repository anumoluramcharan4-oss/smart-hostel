"""Rooms router with floor filtering, allocate, and deallocate operations"""
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from backend.app.db.session import get_db
from backend.app.models.hostel import Room, Profile, Allocation, Block

router = APIRouter(tags=["Rooms"])


class AllocationRequest(BaseModel):
    student_id: str
    bed_number: Optional[str] = None
    bed: Optional[str] = None


class DeallocationRequest(BaseModel):
    student_id: str


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
            "blockId": r.block_id or "blk-a",
            "blockName": r.block_name or "Block A (Newton)",
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
        "blockId": room.block_id or "blk-a",
        "blockName": room.block_name or "Block A (Newton)",
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

    # Check if student is already in another room
    existing_alloc = db.query(Allocation).filter(
        Allocation.student_id == student.id,
        Allocation.is_active == True,
    ).first()
    if existing_alloc:
        # End existing allocation
        existing_alloc.is_active = False
        existing_alloc.deallocated_at = datetime.now(timezone.utc)
        # Update old room if different
        old_room = db.query(Room).filter(Room.id == existing_alloc.room_id).first()
        if old_room and old_room.id != room.id:
            old_occupants = [o for o in (old_room.occupants or []) if o.get("id") != student.id]
            old_room.occupants = old_occupants
            old_room.occupied = len(old_occupants)
            old_room.status = "available" if len(old_occupants) < (old_room.capacity or 4) else "occupied"

    target_bed = payload.bed_number or payload.bed or "Bed 1"

    # End any active allocation on this specific bed in this room
    bed_alloc = db.query(Allocation).filter(
        Allocation.room_number == room.number,
        Allocation.bed_number == target_bed,
        Allocation.is_active == True,
    ).first()
    if bed_alloc and bed_alloc.student_id != student.id:
        raise HTTPException(status_code=400, detail=f"{target_bed} is already occupied")

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
    student.block_name = room.block_name or "Block A (Newton)"

    # Update room occupants
    current_occupants = [o for o in (room.occupants or []) if o.get("id") != student.id]
    current_occupants.append({
        "id": student.id,
        "name": student.full_name,
        "rollNo": student.roll_no or "",
        "bed": payload.bed_number,
        "course": student.course or "",
        "avatar": student.avatar_url or "",
    })

    room.occupants = current_occupants
    room.occupied = len(current_occupants)
    room.status = "occupied" if room.occupied >= (room.capacity or 4) else "available"

    # Update block occupied count
    block = db.query(Block).filter(Block.id == "blk-a").first()
    if block:
        total_occ = db.query(Allocation).filter(Allocation.is_active == True).count()
        block.occupied = total_occ

    db.commit()
    db.refresh(room)

    return {
        "id": room.id,
        "number": room.number,
        "blockId": room.block_id or "blk-a",
        "blockName": room.block_name or "Block A (Newton)",
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
    new_occupants = [o for o in (room.occupants or []) if o.get("id") != student.id]
    room.occupants = new_occupants
    room.occupied = len(new_occupants)
    room.status = "available"

    # Update block occupied count
    block = db.query(Block).filter(Block.id == "blk-a").first()
    if block:
        total_occ = db.query(Allocation).filter(Allocation.is_active == True).count()
        block.occupied = total_occ

    db.commit()
    db.refresh(room)

    return {
        "id": room.id,
        "number": room.number,
        "blockId": room.block_id or "blk-a",
        "blockName": room.block_name or "Block A (Newton)",
        "floor": room.floor,
        "type": room.type or "quad",
        "capacity": room.capacity or 4,
        "occupied": room.occupied or 0,
        "status": room.status or "available",
        "amenities": room.amenities or [],
        "occupants": room.occupants or [],
    }


def uuid_gen() -> str:
    import uuid
    return str(uuid.uuid4())
