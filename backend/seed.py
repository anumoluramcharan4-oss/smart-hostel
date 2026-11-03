"""
Idempotent single-transaction seed script for Smart Hostel (HostelOS).
Seeds:
- 1 building: Block A (Newton), Undergrad Men's Wing
- 5 floors, 6 rooms per floor = 30 rooms (A-101 to A-506)
- 4 beds per room (Bed 1 to Bed 4) = 120 beds
- 120 students, all allocated (100% occupancy, 0 vacant beds)
- 120 unique realistic Indian MALE full names
- Proper batch roll numbers: 26=Year 1, 25=Year 2, 24=Year 3, 23=Year 4
- 25 maintenance tickets with mixed status, priority, and categories
- 120 fee records with payment transactions
- 6 realistic campus notices
- 15 visitor requests
- 10 parcel deliveries
- 12 laundry orders
- 30 room inspections (1 per room)
- Full room inventory (beds, mattresses, study tables, chairs, ceiling fans, tube lights) + stock items
- Preserves admin user and config
"""
import os
import sys
import json
import random
from datetime import datetime, timezone, timedelta

# Ensure parent directory is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.db.session import engine, SessionLocal, Base
from backend.app.models.hostel import (
    Block,
    Room,
    Profile,
    Allocation,
    AllocationHistory,
    Complaint,
    FeeRecord,
    PaymentTransaction,
    Notice,
    Staff,
)
from backend.app.models.visitor import Visitor, VisitorPass, VisitorEvent, VisitorStatus, VisitorCategory
from backend.app.models.parcel import Parcel, ParcelPickupCode, ParcelEvent, ParcelStatus
from backend.app.models.laundry import (
    LaundryRate,
    LaundrySlot,
    LaundryOrder,
    LaundryOrderItem,
    LaundryStatusEvent,
    LaundryOrderStatus,
    LaundryServiceType,
)
from backend.app.models.inspection import (
    InspectionTemplate,
    InspectionTemplateItem,
    Inspection,
    InspectionResult,
    CorrectiveAction,
    InspectionStatus,
    ItemResultStatus,
    InspectionSeverity,
)
from backend.app.models.asset import (
    Asset,
    ConsumableItem,
    AssetMovement,
    AssetDamageReport,
    InventoryTransaction,
    AssetCategory,
    AssetCondition,
    AssetLifecycleStatus,
)

# 120 Unique Realistic Indian Male Names (North, South, East, West)
INDIAN_MALE_NAMES = [
    # North
    ("Aarav", "Patel"), ("Kabir", "Sen"), ("Dev", "Dixit"), ("Vihaan", "Kapoor"),
    ("Aditya", "Sharma"), ("Arjun", "Malhotra"), ("Reyansh", "Bhatia"), ("Dhruv", "Verma"),
    ("Krishna", "Khanna"), ("Rohan", "Mehra"), ("Ishaan", "Bhattacharya"), ("Ayush", "Saxena"),
    ("Harsh", "Gupta"), ("Manish", "Tiwari"), ("Nikhil", "Chopra"), ("Pranav", "Mishra"),
    ("Rishabh", "Pant"), ("Siddharth", "Shukla"), ("Utkarsh", "Pandey"), ("Varun", "Dhawan"),
    ("Yash", "Singhal"), ("Abhay", "Chauhan"), ("Alok", "Nath"), ("Anurag", "Kashyap"),
    ("Deepak", "Chahar"), ("Gaurav", "Goyal"), ("Himanshu", "Rawat"), ("Jatin", "Suri"),
    ("Karan", "Kundra"), ("Mohit", "Raina"),
    # South
    ("Karthik", "Subramanian"), ("Ravi", "Teja"), ("Sai", "Charan"), ("Venkatesh", "Prasad"),
    ("Anand", "Ranganathan"), ("Balaji", "Natarajan"), ("Chandrasekhar", "Rao"), ("Dhanush", "Kalyan"),
    ("Eashwar", "Murthy"), ("Girish", "Kulkarni"), ("Hari", "Haran"), ("Kiran", "Kumar"),
    ("Madhavan", "Nair"), ("Naveen", "Polishetty"), ("Pradeep", "Raghavan"), ("Praveen", "Reddy"),
    ("Rajesh", "Kannan"), ("Sanjay", "Srinivasan"), ("Santhosh", "Narayanan"), ("Saravanan", "Ganesan"),
    ("Sridhar", "Venkataraman"), ("Suresh", "Raina"), ("Surya", "Prakash"), ("Tarun", "Bhaskar"),
    ("Uday", "Shankar"), ("Vijay", "Sethupathi"), ("Vinay", "Babu"), ("Vishnu", "Vardhan"),
    ("Vivek", "Sagar"), ("Yashwanth", "Gowda"),
    # East
    ("Abhishek", "Banerjee"), ("Amitabh", "Ghosh"), ("Arijit", "Mukherjee"), ("Bikram", "Chakraborty"),
    ("Debabrata", "Chatterjee"), ("Deepankar", "Das"), ("Gautam", "Bose"), ("Indrajit", "Roy"),
    ("Joydeep", "Sarkar"), ("Koushik", "Dutta"), ("Manoj", "Majumdar"), ("Niladri", "Mitra"),
    ("Partha", "Pratim"), ("Prasenjit", "Ganguly"), ("Rajarshi", "Basu"), ("Sandip", "Ray"),
    ("Sayan", "Mondal"), ("Somnath", "Bharadwaj"), ("Sourav", "Ganguly"), ("Subhash", "Chandra"),
    ("Sudipto", "Sen"), ("Sunil", "Chhetri"), ("Tanmoy", "Bhattacharya"), ("Tathagata", "Satpathy"),
    ("Tridib", "Haldar"), ("Utpal", "Dutt"), ("Anirban", "Lahiri"), ("Arnab", "Goswami"),
    ("Bhaskar", "Jyoti"), ("Chinmoy", "Barua"),
    # West
    ("Akshay", "Kulkarni"), ("Amol", "Palekar"), ("Aniket", "Deshpande"), ("Bhavesh", "Shah"),
    ("Chetan", "Bhagat"), ("Darshan", "Raval"), ("Dharmendra", "Gohil"), ("Hardik", "Pandya"),
    ("Hemant", "Birje"), ("Hiten", "Tejwani"), ("Jignesh", "Mevani"), ("Ketan", "Mehta"),
    ("Makarand", "Deshpande"), ("Mahesh", "Manjrekar"), ("Milind", "Soman"), ("Nilesh", "Kulkarni"),
    ("Paresh", "Rawal"), ("Prashant", "Damle"), ("Ritesh", "Deshmukh"), ("Sachin", "Tendulkar"),
    ("Sameer", "Dharmadhikari"), ("Shreyas", "Iyer"), ("Swapnil", "Joshi"), ("Tanmay", "Bhat"),
    ("Tushar", "Kapoor"), ("Umesh", "Yadav"), ("Vikram", "Phadnis"), ("Vishal", "Dadlani"),
    ("Yatin", "Karyekar"), ("Zahir", "Khan"),
]

STREAMS = [
    ("Computer Science & Engineering", "BCS"),
    ("Electronics & Communication", "BEC"),
    ("Mechanical Engineering", "BME"),
    ("Civil Engineering", "BCE"),
    ("Information Technology", "BIT"),
]


def generate_seed_data():
    students_list = []
    fees_list = []
    allocations_list = []

    # Map years and batch codes: Year 1 = 26, Year 2 = 25, Year 3 = 24, Year 4 = 23
    year_map = {1: "26", 2: "25", 3: "24", 4: "23"}

    # Distribute 120 students: 30 students per year (Years 1 to 4)
    # Stream distribution: across the 5 streams
    student_index = 0
    room_counter = 0

    # 5 floors, 6 rooms per floor = 30 rooms
    all_rooms = []
    for floor in range(1, 6):
        for r_num in range(1, 7):
            room_name = f"A-{floor}0{r_num}"
            all_rooms.append((room_name, floor))

    # Fee distribution: 84 Paid (70%), 24 Pending (20%), 12 Partial (10%)
    fee_statuses = ["paid"] * 84 + ["pending"] * 24 + ["partial"] * 12
    random.seed(42)
    random.shuffle(fee_statuses)

    used_emails = set()
    used_rolls = set()

    for floor_idx, (room_number, floor) in enumerate(all_rooms):
        room_occupants = []
        for bed_idx in range(1, 5):
            first_name, last_name = INDIAN_MALE_NAMES[student_index]
            full_name = f"{first_name} {last_name}"

            # Year of study: distribute across years 1 to 4
            year = (student_index % 4) + 1
            batch_prefix = year_map[year]
            stream_name, stream_code = STREAMS[(student_index // 4) % len(STREAMS)]

            # Unique Roll Number: e.g. 26BCS001
            roll_number = f"{batch_prefix}{stream_code}{((student_index % 24) + 1):03d}"
            # Ensure roll is strictly unique
            roll_counter = (student_index % 24) + 1
            while roll_number in used_rolls:
                roll_counter += 1
                roll_number = f"{batch_prefix}{stream_code}{roll_counter:03d}"
            used_rolls.add(roll_number)

            # Unique Email
            clean_first = first_name.lower().replace(" ", "")
            clean_last = last_name.lower().replace(" ", "")
            email_candidate = f"{clean_first}.{clean_last}@hostelos.edu"
            if email_candidate in used_emails:
                email_candidate = f"{clean_first}.{clean_last}{roll_number.lower()}@hostelos.edu"
            used_emails.add(email_candidate)

            # Valid 10-digit Indian Mobile: starts with 9, 8, 7, or 6
            phone_num = f"+91 {random.choice([9, 8, 7, 6])}{random.randint(100000000, 999999999)}"

            # Attendance: between 72% and 99%
            attendance = round(random.uniform(72.0, 99.0), 1)

            # Fee configuration
            fee_status = fee_statuses[student_index]
            total_fee = 48000.0
            if fee_status == "paid":
                paid_amt = 48000.0
                due_amt = 0.0
            elif fee_status == "partial":
                paid_amt = 24000.0
                due_amt = 24000.0
            else:
                paid_amt = 0.0
                due_amt = 48000.0

            bed_name = f"Bed {bed_idx}"
            student_id = f"usr-student-{student_index + 1}"

            student_record = {
                "id": student_id,
                "name": full_name,
                "rollNo": roll_number,
                "email": email_candidate,
                "phone": phone_num,
                "roomNumber": room_number,
                "blockName": "Block A (Newton)",
                "bedNumber": bed_name,
                "floor": floor,
                "course": stream_name,
                "year": year,
                "feeStatus": fee_status,
                "feeAmountDue": due_amt,
                "attendancePercent": attendance,
                "avatar": f"https://api.dicebear.com/7.x/avataaars/svg?seed={first_name}{last_name}&gender=male",
                "guardianName": f"Mr. {last_name}",
                "guardianPhone": f"+91 {random.choice([9, 8, 7])}{random.randint(100000000, 999999999)}",
                "joinDate": f"202{6 - year}-08-01",
            }
            students_list.append(student_record)

            room_occupants.append({
                "id": student_id,
                "name": full_name,
                "rollNo": roll_number,
                "bed": bed_name,
                "course": stream_name,
                "avatar": student_record["avatar"],
            })

            allocations_list.append({
                "id": f"alloc-{student_index + 1}",
                "student_id": student_id,
                "room_id": f"rm-a-{floor}0{r_num}",
                "room_number": room_number,
                "bed_number": bed_name,
                "allocated_at": datetime(2026, 8, 1, 9, 0, tzinfo=timezone.utc),
            })

            fees_list.append({
                "id": f"fee-{student_index + 1}",
                "student_id": student_id,
                "student_name": full_name,
                "roll_no": roll_number,
                "room_number": room_number,
                "term": "Term 1, Autumn 2026-2027",
                "total_amount": total_fee,
                "paid_amount": paid_amt,
                "pending_amount": due_amt,
                "status": fee_status,
                "due_date": "2026-11-30",
            })

            student_index += 1

    return all_rooms, students_list, allocations_list, fees_list


def run_seed():
    print("=" * 60)
    print("Starting Idempotent Smart Hostel Seed Execution")
    print("=" * 60)

    # Ensure all tables exist
    Base.metadata.create_all(bind=engine)

    all_rooms, students_list, allocations_list, fees_list = generate_seed_data()

    # Save to frontend JSON
    frontend_json_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../frontend/lib/students_data.json")
    )
    with open(frontend_json_path, "w") as f:
        json.dump(students_list, f, indent=2)
    print(f"Generated {len(students_list)} students in {frontend_json_path}")

    db = SessionLocal()
    try:
        with db.begin():
            print("Wiping existing dummy data (preserving admin & warden credentials)...")

            # Clean dependent tables first
            db.query(AllocationHistory).delete()
            db.query(PaymentTransaction).delete()
            db.query(FeeRecord).delete()
            db.query(Complaint).delete()
            db.query(Notice).delete()
            db.query(VisitorPass).delete()
            db.query(VisitorEvent).delete()
            db.query(Visitor).delete()
            db.query(ParcelPickupCode).delete()
            db.query(ParcelEvent).delete()
            db.query(Parcel).delete()
            db.query(LaundryOrderItem).delete()
            db.query(LaundryStatusEvent).delete()
            db.query(LaundryOrder).delete()
            db.query(LaundrySlot).delete()
            db.query(LaundryRate).delete()
            db.query(CorrectiveAction).delete()
            db.query(InspectionResult).delete()
            db.query(Inspection).delete()
            db.query(InspectionTemplateItem).delete()
            db.query(InspectionTemplate).delete()
            db.query(InventoryTransaction).delete()
            db.query(AssetDamageReport).delete()
            db.query(AssetMovement).delete()
            db.query(ConsumableItem).delete()
            db.query(Asset).delete()
            db.query(Allocation).delete()
            db.query(Room).delete()

            # Remove only student profiles, KEEP admin and warden
            db.query(Profile).filter(Profile.role == "student").delete()

            # Ensure Admin exists
            admin = db.query(Profile).filter(Profile.id == "usr-admin-1").first()
            if not admin:
                admin = Profile(
                    id="usr-admin-1",
                    full_name="Chief Administrator",
                    email="admin@hostelos.edu",
                    phone="+91 98765-00001",
                    role="admin",
                    room_number="ADMIN-HQ",
                    block_name="Administration Wing",
                    roll_no="ADM-001",
                    course="Hostel Administration",
                )
                db.add(admin)

            # Ensure Warden exists
            warden = db.query(Profile).filter(Profile.id == "usr-warden-1").first()
            if not warden:
                warden = Profile(
                    id="usr-warden-1",
                    full_name="Prof. Rajesh K. Sharma",
                    email="rajesh.sharma@hostelos.edu",
                    phone="+91 98111-22334",
                    role="warden",
                    room_number="WARDEN-A1",
                    block_name="Block A (Newton)",
                    roll_no="WRD-001",
                    course="Faculty Resident Warden",
                )
                db.add(warden)

            # 1. Seed Single Block: Block A (Newton)
            db.query(Block).delete()
            block_a = Block(
                id="blk-a",
                name="Block A (Newton)",
                code="BLK-A",
                floors_count=5,
                rooms_count=30,
                capacity=120,
                occupied=120,
                warden_name="Prof. Rajesh K. Sharma",
            )
            db.add(block_a)

            # 2. Seed 30 Rooms (5 Floors x 6 Rooms)
            room_objects = {}
            for room_number, floor in all_rooms:
                room_id = f"rm-a-{room_number.replace('A-', '')}"
                room_obj = Room(
                    id=room_id,
                    number=room_number,
                    block_id="blk-a",
                    block_name="Block A (Newton)",
                    floor=floor,
                    type="quad",
                    capacity=4,
                    occupied=4,
                    status="occupied",
                    amenities=["Wi-Fi 6", "Attached Bath", "Ceiling Fan", "Balcony", "Geyser"],
                    occupants=[],
                )
                db.add(room_obj)
                room_objects[room_number] = room_obj

            # 3. Seed 120 Student Profiles
            print("Seeding 120 unique Indian male students and allocations...")
            for s in students_list:
                p = Profile(
                    id=s["id"],
                    full_name=s["name"],
                    email=s["email"],
                    phone=s["phone"],
                    role="student",
                    avatar_url=s["avatar"],
                    room_number=s["roomNumber"],
                    block_name="Block A (Newton)",
                    bed_number=s["bedNumber"],
                    roll_no=s["rollNo"],
                    course=s["course"],
                    year=s["year"],
                    guardian_name=s["guardianName"],
                    guardian_phone=s["guardianPhone"],
                    fee_status=s["feeStatus"],
                    fee_amount_due=s["feeAmountDue"],
                    attendance_percent=s["attendancePercent"],
                )
                db.add(p)

                # Attach occupant to room
                room_objects[s["roomNumber"]].occupants.append({
                    "id": s["id"],
                    "name": s["name"],
                    "rollNo": s["rollNo"],
                    "bed": s["bedNumber"],
                    "course": s["course"],
                    "avatar": s["avatar"],
                })

            # 4. Seed Allocations & Allocation History
            for a in allocations_list:
                alloc = Allocation(
                    id=a["id"],
                    student_id=a["student_id"],
                    room_id=a["room_id"],
                    room_number=a["room_number"],
                    bed_number=a["bed_number"],
                    is_active=True,
                    allocated_at=a["allocated_at"],
                )
                db.add(alloc)

                # History log
                std = next(s for s in students_list if s["id"] == a["student_id"])
                hist = AllocationHistory(
                    id=f"hist-{a['id']}",
                    student_id=a["student_id"],
                    student_name=std["name"],
                    student_roll=std["rollNo"],
                    room_number=a["room_number"],
                    bed_number=a["bed_number"],
                    action="allocate",
                    performed_by="admin",
                    reason="Academic Year 2026-2027 Term 1 Allotment",
                    created_at=a["allocated_at"],
                )
                db.add(hist)

            # 5. Seed Fees & Payment Transactions
            print("Seeding fees and payment ledger records...")
            for f in fees_list:
                fee = FeeRecord(
                    id=f["id"],
                    student_id=f["student_id"],
                    student_name=f["student_name"],
                    roll_no=f["roll_no"],
                    room_number=f["room_number"],
                    term=f["term"],
                    total_amount=f["total_amount"],
                    paid_amount=f["paid_amount"],
                    pending_amount=f["pending_amount"],
                    status=f["status"],
                    due_date=f["due_date"],
                )
                db.add(fee)

                if f["paid_amount"] > 0:
                    tx = PaymentTransaction(
                        id=f"tx-{f['id']}",
                        fee_id=f["id"],
                        student_id=f["student_id"],
                        amount=f["paid_amount"],
                        payment_method="UPI",
                        transaction_ref=f"UPI-{random.randint(10000000, 99999999)}",
                        paid_at=datetime(2026, 8, 15, 14, 30, tzinfo=timezone.utc),
                    )
                    db.add(tx)

            # 6. Seed Complaints: 25 tickets across categories, priorities, statuses
            print("Seeding 25 maintenance tickets across Block A...")
            complaint_samples = [
                ("Geyser tripping MCB breaker", "The water geyser causes the miniature circuit breaker to trip whenever switched on.", "electrical", "urgent", "in_progress", "Manoj Sharma (Electrician)"),
                ("Ceiling fan regulator stuck", "Fan speed cannot be controlled and makes humming noise on setting 5.", "electrical", "medium", "pending", None),
                ("Flush valve leaking in washroom", "Continuous trickling of water into the flush pot.", "plumbing", "high", "in_progress", "Rajesh Verma (Plumber)"),
                ("Drain line choked in balcony", "Water backs up during rain.", "plumbing", "medium", "resolved", "Rajesh Verma (Plumber)"),
                ("Wi-Fi Access Point dropped signal", "High ping and packet loss in evening study hours.", "wifi", "urgent", "in_progress", "Suresh Patil (Network)"),
                ("Study chair hydraulic broken", "Chair sinks to the lowest level when sat upon.", "furniture", "low", "pending", None),
                ("Wardrobe lock alignment issue", "Key sticks in cylinder lock; difficult to open.", "furniture", "medium", "resolved", "Vikram Seth (Carpentry)"),
                ("Window mesh torn by pigeon", "Mosquito netting has a 3-inch tear near the hinge.", "furniture", "low", "pending", None),
                ("Balcony floor dust accumulation", "Requesting wet scrub after exterior facade painting.", "cleaning", "low", "resolved", "Anita Devi (Housekeeping)"),
                ("Bathroom tile crack repair", "Two floor tiles loosened near shower stall.", "plumbing", "medium", "pending", None),
                ("Study lamp socket spark", "Socket sparks when plugging in 65W laptop charger.", "electrical", "urgent", "in_progress", "Manoj Sharma (Electrician)"),
                ("LAN port RJ45 jack loose", "Wall RJ45 connector has a broken retention clip.", "wifi", "medium", "pending", None),
                ("Door stopper loose", "Room entrance door slams during windy afternoon.", "furniture", "low", "resolved", "Vikram Seth (Carpentry)"),
                ("Water dispenser cold tap stuck", "Floor water dispenser button gets stuck depressed.", "plumbing", "high", "in_progress", "Rajesh Verma (Plumber)"),
                ("Balcony tube light flickering", "Choke or starter failure in outdoor fluorescent tube.", "electrical", "low", "resolved", "Manoj Sharma (Electrician)"),
                ("Mattress spring protruding", "Corner spring causing discomfort.", "furniture", "medium", "pending", None),
                ("Washbasin faucet aerator choked", "Low water pressure from tap due to sediment deposit.", "plumbing", "low", "resolved", "Rajesh Verma (Plumber)"),
                ("Corridor Wi-Fi repeater rebooting", "Mesh AP loses uplink every 20 minutes.", "wifi", "high", "in_progress", "Suresh Patil (Network)"),
                ("Exhaust fan vibration noise", "Bathroom exhaust fan vibrates against wall mounting.", "electrical", "medium", "pending", None),
                ("Study desk drawer handle detached", "Screws loosened on left drawer pull handle.", "furniture", "low", "resolved", "Vikram Seth (Carpentry)"),
                ("Mirror clip loose", "Wall mirror in bathroom wobbles when touched.", "furniture", "medium", "pending", None),
                ("AC/Cooler circuit tripping", "Load imbalance on high speed setting.", "electrical", "urgent", "in_progress", "Manoj Sharma (Electrician)"),
                ("Main entrance latch sticky", "Deadbolt requires excessive force to turn.", "furniture", "medium", "resolved", "Vikram Seth (Carpentry)"),
                ("Shower head limescale block", "Spray unevenly distributed.", "plumbing", "low", "pending", None),
                ("Ethernet drop throughput low", "Speed tests capping at 10 Mbps instead of 1 Gbps.", "wifi", "high", "resolved", "Suresh Patil (Network)"),
            ]

            now = datetime.now(timezone.utc)
            for idx, (title, desc, cat, priority, status, assigned) in enumerate(complaint_samples):
                st = students_list[1 if idx == 1 else (idx * 4)]  # ensure Kabir Sen (usr-student-2) has a ticket
                created_ts = now - timedelta(days=(25 - idx))
                cmp_id = f"cmp-2026-{idx + 1:04d}"
                c = Complaint(
                    id=cmp_id,
                    title=title,
                    description=desc,
                    category=cat,
                    priority=priority,
                    status=status,
                    student_id=st["id"],
                    student_name=st["name"],
                    room_number=st["roomNumber"],
                    block_name="Block A (Newton)",
                    assigned_to=assigned,
                    resolution_notes="Work inspected and confirmed by resident warden." if status == "resolved" else None,
                    timeline=[
                        {"status": "pending", "timestamp": created_ts.isoformat(), "note": "Complaint logged by student."},
                        *(
                            [{"status": "in_progress", "timestamp": (created_ts + timedelta(hours=2)).isoformat(), "note": f"Assigned to {assigned}."}]
                            if status in ("in_progress", "resolved")
                            else []
                        ),
                        *(
                            [{"status": "resolved", "timestamp": (created_ts + timedelta(days=1)).isoformat(), "note": "Resolved and verified."}]
                            if status == "resolved"
                            else []
                        ),
                    ],
                    created_at=created_ts,
                    updated_at=now,
                )
                db.add(c)

            # 7. Seed Notices (6 realistic notices)
            print("Seeding campus notices...")
            notices_data = [
                ("Water Supply Maintenance Schedule", "Overhead tank cleaning and valve maintenance scheduled on Saturday 9:00 AM to 1:00 PM. Please store sufficient potable water.", "maintenance", "urgent", "Chief Warden Office"),
                ("Annual Inter-Hostel Cricket Tournament", "Team registrations for Newton Wing XI are open until Friday evening at the Sports Office.", "general", "normal", "Sports Council"),
                ("Biometric Curfew Grace Period Notice", "Night roll-call verification starts strictly at 10:30 PM. Late entries require signed warden pass.", "security", "important", "Campus Security"),
                ("High-Speed Wi-Fi 6 Upgrade", "Floor access points in Block A have been upgraded to 1 Gbps symmetric backhaul. Report any dead zones.", "general", "normal", "IT Services"),
                ("Mess Advisory: Festive Dinner Menu", "Special Diwali feast will be served this Sunday from 7:30 PM to 10:00 PM.", "general", "normal", "Mess Committee"),
                ("Fire Drill & Evacuation Safety Briefing", "Mandatory fire drill conducted on Wednesday at 4:00 PM. Assembly point: Central Lawn.", "security", "urgent", "Safety & Compliance"),
            ]
            for idx, (title, content, cat, prio, author) in enumerate(notices_data):
                n = Notice(
                    id=f"not-{idx + 1}",
                    title=title,
                    content=content,
                    category=cat,
                    priority=prio,
                    author=author,
                    target_audience="all",
                    created_at=now - timedelta(days=(7 - idx)),
                    expires_at=now + timedelta(days=30),
                )
                db.add(n)

            # 8. Seed Visitors (15 records)
            print("Seeding visitor records...")
            visitor_names = [
                ("Sunil Patel", "PARENT", "Father visiting for semester fee payment"),
                ("Kavita Sen", "FAMILY", "Mother delivering winter clothing"),
                ("Ramesh Dixit", "PARENT", "Weekend family visit"),
                ("Arvind Sharma", "PARENT", "Academic meeting with warden"),
                ("Pooja Verma", "FAMILY", "Sister visiting campus"),
                ("Deepak Chopra", "FRIEND", "High school alumnus visit"),
                ("Mukesh Tiwari", "PARENT", "Parent check-in"),
                ("Suman Mukherjee", "FAMILY", "Guardian visiting"),
                ("Nitin Goyal", "FRIEND", "Project collaboration"),
                ("Vikram Reddy", "PARENT", "Father visiting"),
                ("Shanti Kulkarni", "FAMILY", "Mother visiting"),
                ("Anil Deshmukh", "PARENT", "Parent signature on scholarship doc"),
                ("Girish Rao", "PARENT", "Medical check-up visit"),
                ("Lata Banerjee", "FAMILY", "Family visit from Kolkata"),
                ("Kamlesh Shah", "PARENT", "Semester break travel coordination"),
            ]
            for idx, (v_name, cat, purp) in enumerate(visitor_names):
                host_st = students_list[idx * 7]
                vis_id = f"vis-2026-{idx + 1:04d}"
                exp_arr = now - timedelta(hours=(24 - idx * 2))
                exp_dep = exp_arr + timedelta(hours=3)
                v_status = VisitorStatus.CHECKED_OUT if idx < 8 else (VisitorStatus.CHECKED_IN if idx < 12 else VisitorStatus.APPROVED)

                v = Visitor(
                    id=vis_id,
                    name=v_name,
                    phone=f"+91 98{random.randint(10000000, 99999999)}",
                    category=VisitorCategory(cat),
                    host_student_id=host_st["id"],
                    host_student_name=host_st["name"],
                    host_student_room=host_st["roomNumber"],
                    host_student_block="Block A (Newton)",
                    purpose=purp,
                    expected_arrival=exp_arr,
                    expected_departure=exp_dep,
                    status=v_status,
                    reviewed_by="Prof. Rajesh K. Sharma",
                    reviewed_at=exp_arr - timedelta(hours=1),
                )
                db.add(v)

            # 9. Seed Parcels (10 records: collected and pending)
            print("Seeding parcel deliveries...")
            couriers = ["Amazon", "Bluedart", "DTDC", "Delhivery", "Flipkart Logistics"]
            for idx in range(10):
                st = students_list[idx * 11]
                p_status = ParcelStatus.COLLECTED if idx < 6 else ParcelStatus.AWAITING_COLLECTION
                pcl = Parcel(
                    id=f"pcl-2026-{idx + 1:04d}",
                    parcel_ref=f"PCL-2026-{9000 + idx}",
                    recipient_student_id=st["id"],
                    recipient_name=st["name"],
                    recipient_room=st["roomNumber"],
                    recipient_block="Block A (Newton)",
                    courier=couriers[idx % len(couriers)],
                    tracking_number=f"TRK{random.randint(100000000, 999999999)}",
                    storage_location=f"Locker #{idx + 1}",
                    locker_number=str(idx + 1),
                    received_by="Security Desk 1",
                    status=p_status,
                    collected_at=now - timedelta(hours=4) if p_status == ParcelStatus.COLLECTED else None,
                    handed_over_by="Guard Ramesh" if p_status == ParcelStatus.COLLECTED else None,
                )
                db.add(pcl)

            # 10. Seed Laundry (Rates, Slots, Orders)
            print("Seeding laundry module...")
            rates = [
                ("SHIRT", LaundryServiceType.WASH_AND_IRON, 15.0),
                ("TROUSER", LaundryServiceType.WASH_AND_IRON, 18.0),
                ("BEDSHEET", LaundryServiceType.WASH_AND_FOLD, 35.0),
                ("TOWEL", LaundryServiceType.WASH_AND_FOLD, 12.0),
                ("JACKET", LaundryServiceType.DRY_CLEAN, 80.0),
            ]
            for cat, s_type, rate in rates:
                lr = LaundryRate(
                    id=f"rate-{cat.lower()}",
                    item_category=cat,
                    service_type=s_type,
                    rate_per_piece=rate,
                    is_active="TRUE",
                )
                db.add(lr)

            slot = LaundrySlot(
                id="slot-today-morning",
                slot_date=now.strftime("%Y-%m-%d"),
                time_window="09:00 - 11:00 AM",
                max_capacity=20,
                booked_count=12,
                is_open="TRUE",
            )
            db.add(slot)

            laundry_statuses = [
                LaundryOrderStatus.DELIVERED,
                LaundryOrderStatus.DELIVERED,
                LaundryOrderStatus.READY_FOR_COLLECTION,
                LaundryOrderStatus.PROCESSING,
                LaundryOrderStatus.PROCESSING,
                LaundryOrderStatus.COLLECTED,
                LaundryOrderStatus.SCHEDULED,
                LaundryOrderStatus.REQUESTED,
                LaundryOrderStatus.DELIVERED,
                LaundryOrderStatus.READY_FOR_COLLECTION,
                LaundryOrderStatus.PROCESSING,
                LaundryOrderStatus.SCHEDULED,
            ]
            for idx, l_status in enumerate(laundry_statuses):
                st = students_list[idx * 9]
                lo = LaundryOrder(
                    id=f"lnd-order-{idx + 1}",
                    order_ref=f"LND-2026-{1000 + idx}",
                    student_id=st["id"],
                    student_name=st["name"],
                    room_number=st["roomNumber"],
                    block_name="Block A (Newton)",
                    service_type=LaundryServiceType.WASH_AND_IRON,
                    slot_id="slot-today-morning",
                    pickup_date=now.strftime("%Y-%m-%d"),
                    pickup_time_slot="09:00 - 11:00 AM",
                    status=l_status,
                    submitted_item_count=5,
                    confirmed_item_count=5,
                    estimated_amount=120.0,
                    final_amount=120.0,
                    billing_status="PAID_DIRECT" if l_status == LaundryOrderStatus.DELIVERED else "PENDING",
                )
                db.add(lo)

            # 11. Seed Room Inspections: 1 recent inspection per room (30 rooms)
            print("Seeding room cleanliness inspections for all 30 rooms...")
            template = InspectionTemplate(
                id="tmpl-weekly-audit",
                title="Weekly Dorm & Hygiene Checklist",
                description="Standard hygiene, wiring, fixture, and cleanliness audit.",
                is_active="TRUE",
            )
            db.add(template)

            for idx, (room_number, floor) in enumerate(all_rooms):
                score = round(random.uniform(82.0, 98.0), 1)
                insp_status = InspectionStatus.COMPLETED if score >= 85 else InspectionStatus.FOLLOW_UP_REQUIRED
                insp = Inspection(
                    id=f"insp-rm-{room_number.replace('A-', '')}",
                    inspection_ref=f"INS-2026-{room_number.replace('A-', '')}",
                    template_id="tmpl-weekly-audit",
                    building="Newton Wing",
                    block="Block A",
                    floor=floor,
                    room_number=room_number,
                    scheduled_date=(now - timedelta(days=idx)).strftime("%Y-%m-%d"),
                    completed_at=now - timedelta(days=idx),
                    inspector_id="usr-warden-1",
                    inspector_name="Prof. Rajesh K. Sharma",
                    status=insp_status,
                    cleanliness_score=score,
                    overall_result="PASS" if score >= 85 else "FAIL",
                    general_notes=f"Room {room_number} hygiene check completed. Overall cleanliness is excellent.",
                )
                db.add(insp)

            # 12. Seed Inventory: beds, mattresses, tables, chairs, fans, lights per room + stock
            print("Seeding physical asset inventory across all 30 rooms...")
            for idx, (room_number, floor) in enumerate(all_rooms):
                # 4 Beds
                for b_idx in range(1, 5):
                    db.add(Asset(
                        id=f"ast-{room_number}-bed-{b_idx}",
                        asset_tag=f"AST-{room_number}-BED-0{b_idx}",
                        name=f"Heavy Duty Steel Bunk/Single Bed {b_idx}",
                        category=AssetCategory.FURNITURE,
                        block="Block A",
                        floor=floor,
                        room_number=room_number,
                        bed_number=f"Bed {b_idx}",
                        condition=AssetCondition.GOOD,
                        status=AssetLifecycleStatus.IN_USE,
                        purchase_cost=4500.0,
                    ))
                    # Mattress
                    db.add(Asset(
                        id=f"ast-{room_number}-mat-{b_idx}",
                        asset_tag=f"AST-{room_number}-MAT-0{b_idx}",
                        name=f"High Density Foam Mattress {b_idx}",
                        category=AssetCategory.BEDDING,
                        block="Block A",
                        floor=floor,
                        room_number=room_number,
                        bed_number=f"Bed {b_idx}",
                        condition=AssetCondition.GOOD,
                        status=AssetLifecycleStatus.IN_USE,
                        purchase_cost=2200.0,
                    ))
                    # Study Table
                    db.add(Asset(
                        id=f"ast-{room_number}-tbl-{b_idx}",
                        asset_tag=f"AST-{room_number}-TBL-0{b_idx}",
                        name=f"Ergonomic Wooden Study Desk {b_idx}",
                        category=AssetCategory.FURNITURE,
                        block="Block A",
                        floor=floor,
                        room_number=room_number,
                        bed_number=f"Bed {b_idx}",
                        condition=AssetCondition.GOOD,
                        status=AssetLifecycleStatus.IN_USE,
                        purchase_cost=3200.0,
                    ))
                    # Study Chair
                    db.add(Asset(
                        id=f"ast-{room_number}-chr-{b_idx}",
                        asset_tag=f"AST-{room_number}-CHR-0{b_idx}",
                        name=f"Mesh Back Task Chair {b_idx}",
                        category=AssetCategory.FURNITURE,
                        block="Block A",
                        floor=floor,
                        room_number=room_number,
                        bed_number=f"Bed {b_idx}",
                        condition=AssetCondition.GOOD,
                        status=AssetLifecycleStatus.IN_USE,
                        purchase_cost=1800.0,
                    ))

                # Room Ceiling Fan (2 fans per quad room)
                for f_idx in (1, 2):
                    db.add(Asset(
                        id=f"ast-{room_number}-fan-{f_idx}",
                        asset_tag=f"AST-{room_number}-FAN-0{f_idx}",
                        name=f"1200mm High Speed Ceiling Fan {f_idx}",
                        category=AssetCategory.APPLIANCE,
                        block="Block A",
                        floor=floor,
                        room_number=room_number,
                        condition=AssetCondition.GOOD,
                        status=AssetLifecycleStatus.IN_USE,
                        purchase_cost=1650.0,
                    ))

                # Room LED Tube Lights (2 per quad room)
                for l_idx in (1, 2):
                    db.add(Asset(
                        id=f"ast-{room_number}-led-{l_idx}",
                        asset_tag=f"AST-{room_number}-LED-0{l_idx}",
                        name=f"20W Daylight LED Batten {l_idx}",
                        category=AssetCategory.ELECTRICAL_FIXTURE,
                        block="Block A",
                        floor=floor,
                        room_number=room_number,
                        condition=AssetCondition.GOOD,
                        status=AssetLifecycleStatus.IN_USE,
                        purchase_cost=450.0,
                    ))

            # Stock inventory items
            stock_items = [
                ("AST-STK-MAT-01", "Spare Foam Mattress", AssetCategory.BEDDING, 10),
                ("AST-STK-CHR-01", "Spare Study Chair", AssetCategory.FURNITURE, 8),
                ("AST-STK-FAN-01", "Spare 1200mm Ceiling Fan", AssetCategory.APPLIANCE, 5),
                ("AST-STK-LED-01", "20W LED Batten Spares", AssetCategory.ELECTRICAL_FIXTURE, 25),
            ]
            for tag, name, cat, qty in stock_items:
                for q_idx in range(qty):
                    db.add(Asset(
                        id=f"ast-stock-{tag.lower()}-{q_idx + 1}",
                        asset_tag=f"{tag}-{q_idx + 1:02d}",
                        name=name,
                        category=cat,
                        block="Central Warehouse",
                        floor=1,
                        room_number="STOCK-ROOM-1",
                        condition=AssetCondition.NEW,
                        status=AssetLifecycleStatus.AVAILABLE,
                        purchase_cost=1500.0,
                    ))

            # 14 Maintenance Staff Workers (2 per trade across 7 categories)
            staff_data = [
                # Electrical
                ("stf-elec-1", "Ramesh Kumar", "9820145231", "Electrical"),
                ("stf-elec-2", "Rajesh Verma", "9711894320", "Electrical"),
                # Plumbing & Water
                ("stf-plumb-1", "Suresh Patel", "8826541098", "Plumbing & Water"),
                ("stf-plumb-2", "Mahendra Yadav", "8700234189", "Plumbing & Water"),
                # Wi-Fi & Internet
                ("stf-wifi-1", "Amit Sharma", "7982410567", "Wi-Fi & Internet"),
                ("stf-wifi-2", "Vikram Rathore", "7838129045", "Wi-Fi & Internet"),
                # Housekeeping / Cleaning
                ("stf-clean-1", "Santosh Meena", "6392018475", "Housekeeping / Cleaning"),
                ("stf-clean-2", "Manoj Chauhan", "6289450123", "Housekeeping / Cleaning"),
                # Mess & Dining
                ("stf-mess-1", "Jagdish Singh", "9451203874", "Mess & Dining"),
                ("stf-mess-2", "Dilip Joshi", "8447819203", "Mess & Dining"),
                # Carpentry / Furniture
                ("stf-carp-1", "Ramvilas Prajapati", "7303918245", "Carpentry / Furniture"),
                ("stf-carp-2", "Govind Suthar", "6388102947", "Carpentry / Furniture"),
                # Other Hostel Defect -> General Maintenance
                ("stf-gen-1", "Ashok Gujjar", "9123847510", "General Maintenance"),
                ("stf-gen-2", "Dinesh Solanki", "8130928471", "General Maintenance"),
            ]
            for s_id, s_name, s_phone, s_trade in staff_data:
                db.merge(Staff(
                    id=s_id,
                    name=s_name,
                    phone=s_phone,
                    trade=s_trade,
                    status="active",
                    created_at=datetime.now(timezone.utc),
                ))

            print("=" * 60)
            print("SEED TRANSACTION READY: Committing to database...")
            print("=" * 60)

    except Exception as exc:
        print(f"ERROR during seed execution: {exc}")
        db.rollback()
        raise
    finally:
        db.close()

    print("SUCCESS: Seed execution finished cleanly in single transaction!")
    print(f"Summary: 1 Block, 5 Floors, 30 Rooms, 120 Beds, 120 Students (100% Occupancy).")


if __name__ == "__main__":
    run_seed()
