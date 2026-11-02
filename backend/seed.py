"""
HostelOS Single-Transaction Idempotent Seed Script
Seeds 1 building (Block A, Newton), 5 floors, 30 rooms (6 per floor),
4 beds per room (120 beds), 120 allocated Indian male students (100% occupancy).
"""
import json
import os
import sys
import uuid
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.db.session import engine, SessionLocal, Base
from backend.app.models.hostel import Block, Room, Profile, Allocation


def run_seed():
    print("Ensuring database tables exist...")
    Base.metadata.create_all(bind=engine)

    json_path = Path(__file__).resolve().parent.parent / "frontend" / "lib" / "students_data.json"
    with open(json_path, "r") as f:
        data = json.load(f)

    students_data = data["students"]
    rooms_data = data["rooms"]

    with SessionLocal() as db:
        with db.begin():
            print("Cleaning legacy student profiles, allocations, and rooms...")
            # 1. Wipe existing student allocations, student profiles, and rooms
            db.query(Allocation).delete()
            db.query(Profile).filter(Profile.role == "student").delete()
            db.query(Room).delete()
            db.query(Block).filter(Block.id != "blk-a").delete()

            # 2. Upsert Admin & Warden Users (kept intact)
            admin = db.query(Profile).filter(Profile.id == "usr-admin-1").first()
            if not admin:
                admin = Profile(
                    id="usr-admin-1",
                    full_name="Sarah Jenkins",
                    email="sarah.jenkins@hostelos.edu",
                    phone="+91 98765 43210",
                    role="admin",
                    avatar_url="https://api.dicebear.com/9.x/initials/svg?seed=Sarah%20Jenkins&backgroundColor=0284c7&textColor=ffffff",
                    course="Chief Administrator",
                )
                db.add(admin)

            warden = db.query(Profile).filter(Profile.id == "usr-warden-1").first()
            if not warden:
                warden = Profile(
                    id="usr-warden-1",
                    full_name="Prof. Rajesh K. Sharma",
                    email="rajesh.sharma@hostelos.edu",
                    phone="+91 98111 22334",
                    role="warden",
                    avatar_url="https://api.dicebear.com/9.x/initials/svg?seed=Rajesh%20Sharma&backgroundColor=0284c7&textColor=ffffff",
                    course="Senior Resident Warden",
                )
                db.add(warden)

            # 3. Upsert Block A (Newton) - 5 Floors, 30 Rooms, 120 Beds
            block = db.query(Block).filter(Block.id == "blk-a").first()
            if not block:
                block = Block(
                    id="blk-a",
                    name="Block A (Newton)",
                    code="BLK-A",
                    floors_count=5,
                    rooms_count=30,
                    capacity=120,
                    occupied=120,
                    warden_name="Prof. Rajesh K. Sharma",
                )
                db.add(block)
            else:
                block.name = "Block A (Newton)"
                block.code = "BLK-A"
                block.floors_count = 5
                block.rooms_count = 30
                block.capacity = 120
                block.occupied = 120
                block.warden_name = "Prof. Rajesh K. Sharma"

            # 4. Insert 30 Rooms across 5 floors
            print("Seeding 30 rooms (5 floors x 6 rooms)...")
            for r in rooms_data:
                room_obj = Room(
                    id=r["id"],
                    number=r["number"],
                    block_id=r["blockId"],
                    block_name=r["blockName"],
                    floor=r["floor"],
                    type=r["type"],
                    capacity=r["capacity"],
                    occupied=r["occupied"],
                    status=r["status"],
                    amenities=r.get("amenities", []),
                    occupants=r.get("occupants", []),
                )
                db.add(room_obj)

            # 5. Insert 120 Unique Indian Male Students
            print("Seeding 120 unique Indian male students...")
            for s in students_data:
                student_obj = Profile(
                    id=s["id"],
                    full_name=s["name"],
                    email=s["email"],
                    phone=s["phone"],
                    role="student",
                    avatar_url=s["avatar"],
                    room_number=s["roomNumber"],
                    block_name=s["blockName"],
                    bed_number=s["bedNumber"],
                    roll_no=s["rollNo"],
                    course=s["course"],
                    year=s["year"],
                    guardian_name=s.get("guardianName", ""),
                    guardian_phone=s.get("guardianPhone", ""),
                    fee_status=s.get("feeStatus", "paid"),
                    fee_amount_due=s.get("feeAmountDue", 0),
                    attendance_percent=s.get("attendancePercent", 95),
                )
                db.add(student_obj)

                # 6. Insert Active Allocation
                rm_id = f"rm-a-{s['roomNumber'][2:]}"
                alloc_obj = Allocation(
                    id=f"alloc-{s['id']}",
                    student_id=s["id"],
                    room_id=rm_id,
                    room_number=s["roomNumber"],
                    bed_number=s["bedNumber"],
                    is_active=True,
                )
                db.add(alloc_obj)

    print("Seed complete! 1 building, 5 floors, 30 rooms, 120 students (100% occupied).")


if __name__ == "__main__":
    run_seed()

