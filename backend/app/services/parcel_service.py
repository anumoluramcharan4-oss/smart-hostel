import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from fastapi import HTTPException
from sqlalchemy.orm import Session
from backend.app.models.parcel import Parcel, ParcelPickupCode, ParcelEvent, ParcelStatus
from backend.app.schemas.parcel import ParcelCreate, ParcelPickupVerification

class ParcelService:
    @staticmethod
    def register_parcel(db: Session, data: ParcelCreate, staff_name: str = "Reception Desk") -> Parcel:
        # Check locker collision: cannot have two active packages in same physical locker
        if data.locker_number:
            active_locker_parcel = db.query(Parcel).filter(
                Parcel.locker_number == data.locker_number,
                Parcel.status.in_([ParcelStatus.AWAITING_COLLECTION, ParcelStatus.RECEIVED])
            ).first()
            if active_locker_parcel:
                raise HTTPException(
                    status_code=400,
                    detail=f"Locker #{data.locker_number} is already occupied by parcel {active_locker_parcel.parcel_ref}. Choose another locker."
                )

        ref = f"PCL-{datetime.now().year}-{secrets.randbelow(9000) + 1000}"
        
        parcel = Parcel(
            parcel_ref=ref,
            recipient_student_id=data.recipient_student_id,
            recipient_name=data.recipient_name,
            recipient_room=data.recipient_room,
            recipient_block=data.recipient_block,
            courier=data.courier,
            tracking_number=data.tracking_number,
            storage_location=data.storage_location,
            locker_number=data.locker_number,
            received_by=staff_name,
            status=ParcelStatus.AWAITING_COLLECTION,
            notes=data.notes
        )
        db.add(parcel)
        db.flush()

        # Generate cryptographic 6-digit OTP code for secure pickup (Valid for 48 hours)
        otp = f"{secrets.randbelow(900000) + 100000}"
        code_obj = ParcelPickupCode(
            parcel_id=parcel.id,
            code=otp,
            valid_until=datetime.now(timezone.utc) + timedelta(hours=48),
            used="FALSE",
            attempts=0
        )
        db.add(code_obj)

        event = ParcelEvent(
            parcel_id=parcel.id,
            event_type="REGISTERED",
            actor_id=staff_name,
            actor_role="staff",
            details=f"Parcel received via {data.courier} and stored at {data.storage_location}. Secret OTP issued."
        )
        db.add(event)

        db.commit()
        db.refresh(parcel)
        return parcel

    @staticmethod
    def verify_and_collect(db: Session, verification: ParcelPickupVerification) -> Parcel:
        parcel = db.query(Parcel).filter(Parcel.parcel_ref == verification.parcel_ref).first()
        if not parcel:
            raise HTTPException(status_code=404, detail="Parcel not found")

        if parcel.status == ParcelStatus.COLLECTED:
            raise HTTPException(
                status_code=400,
                detail=f"Duplicate pickup rejected: Parcel {parcel.parcel_ref} was already collected at {parcel.collected_at}."
            )

        if parcel.status != ParcelStatus.AWAITING_COLLECTION:
            raise HTTPException(status_code=400, detail=f"Cannot collect parcel with status '{parcel.status}'")

        # Find active pickup code
        code_obj = db.query(ParcelPickupCode).filter(
            ParcelPickupCode.parcel_id == parcel.id,
            ParcelPickupCode.used == "FALSE"
        ).order_by(ParcelPickupCode.created_at.desc()).first()

        if not code_obj:
            raise HTTPException(status_code=400, detail="No active pickup code found for this parcel")

        # Rate limiting: max 5 failed attempts
        if code_obj.attempts >= 5:
            raise HTTPException(
                status_code=429,
                detail="Too many failed pickup attempts. Code locked for security. Contact hostel warden."
            )

        # Expiry check
        now = datetime.now(timezone.utc)
        valid_until = code_obj.valid_until if code_obj.valid_until.tzinfo else code_obj.valid_until.replace(tzinfo=timezone.utc)
        if now > valid_until:
            raise HTTPException(status_code=400, detail="Pickup code has expired. Please request a new code.")

        # Code verification
        if code_obj.code != verification.pickup_code.strip():
            code_obj.attempts += 1
            db.commit()
            raise HTTPException(
                status_code=400,
                detail=f"Invalid pickup code. Attempt {code_obj.attempts} of 5."
            )

        # Validated successfully -> atomize collection
        code_obj.used = "TRUE"
        parcel.status = ParcelStatus.COLLECTED
        parcel.collected_at = datetime.now(timezone.utc)
        parcel.handed_over_by = f"{verification.staff_name} ({verification.staff_id})"

        event = ParcelEvent(
            parcel_id=parcel.id,
            event_type="COLLECTED",
            actor_id=verification.staff_id,
            actor_role="staff",
            details=f"Secure OTP verified. Handed over to recipient {parcel.recipient_name}."
        )
        db.add(event)
        db.commit()
        db.refresh(parcel)
        return parcel

    @staticmethod
    def get_stats(db: Session):
        awaiting = db.query(Parcel).filter(Parcel.status == ParcelStatus.AWAITING_COLLECTION).count()
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0)
        
        collected_today = db.query(Parcel).filter(
            Parcel.status == ParcelStatus.COLLECTED,
            Parcel.collected_at >= today_start
        ).count()

        # Check parcels awaiting collection older than 3 days
        three_days_ago = datetime.now(timezone.utc) - timedelta(days=3)
        overdue = db.query(Parcel).filter(
            Parcel.status == ParcelStatus.AWAITING_COLLECTION,
            Parcel.created_at <= three_days_ago
        ).count()

        total = db.query(Parcel).count()

        return {
            "awaiting_collection": awaiting,
            "collected_today": collected_today,
            "overdue_count": overdue,
            "total_received": total
        }
