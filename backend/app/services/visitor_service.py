import secrets
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.models.visitor import Visitor, VisitorPass, VisitorEvent, VisitorStatus, VisitorCategory
from backend.app.schemas.visitor import VisitorCreate, VisitorReview, VisitorCheckInOut

class VisitorService:
    @staticmethod
    def register_visitor(db: Session, data: VisitorCreate, registered_by: str = "security") -> Visitor:
        # Business policy: If Parent/Family arriving during daytime (08:00 to 20:00), auto-approve; else hold for warden
        auto_approve = False
        arrival_hour = data.expected_arrival.hour
        if data.category in [VisitorCategory.PARENT, VisitorCategory.FAMILY] and 8 <= arrival_hour < 20:
            auto_approve = True

        init_status = VisitorStatus.APPROVED if auto_approve else VisitorStatus.PENDING_APPROVAL

        visitor = Visitor(
            name=data.name,
            phone=data.phone,
            email=data.email,
            id_proof_type=data.id_proof_type,
            id_proof_number=data.id_proof_number,
            category=data.category,
            host_student_id=data.host_student_id,
            host_student_name=data.host_student_name,
            host_student_room=data.host_student_room,
            host_student_block=data.host_student_block,
            purpose=data.purpose,
            expected_arrival=data.expected_arrival,
            expected_departure=data.expected_departure,
            status=init_status,
            notes=data.notes,
            reviewed_by="SYSTEM_AUTO_POLICY" if auto_approve else None,
            reviewed_at=datetime.now(timezone.utc) if auto_approve else None
        )
        db.add(visitor)
        db.flush()

        # Log creation event
        event = VisitorEvent(
            visitor_id=visitor.id,
            event_type="REGISTERED",
            actor_id=registered_by,
            actor_role="security",
            details=f"Visitor registered for {visitor.host_student_name}. Policy auto_approved={auto_approve}"
        )
        db.add(event)

        # Generate pass if auto-approved
        if auto_approve:
            pass_code = f"VP-{secrets.token_hex(4).upper()}"
            vpass = VisitorPass(
                visitor_id=visitor.id,
                pass_code=pass_code,
                valid_from=visitor.expected_arrival,
                valid_until=visitor.expected_departure
            )
            db.add(vpass)

        db.commit()
        db.refresh(visitor)
        return visitor

    @staticmethod
    def review_visitor(db: Session, visitor_id: str, review: VisitorReview) -> Visitor:
        visitor = db.query(Visitor).filter(Visitor.id == visitor_id).first()
        if not visitor:
            raise HTTPException(status_code=404, detail="Visitor not found")
        
        if visitor.status != VisitorStatus.PENDING_APPROVAL:
            raise HTTPException(status_code=400, detail=f"Cannot review visitor in status {visitor.status}")

        if review.approved:
            visitor.status = VisitorStatus.APPROVED
            visitor.reviewed_by = f"{review.reviewer_name} ({review.reviewer_id})"
            visitor.reviewed_at = datetime.now(timezone.utc)
            
            # Generate secure pass
            pass_code = f"VP-{secrets.token_hex(4).upper()}"
            vpass = VisitorPass(
                visitor_id=visitor.id,
                pass_code=pass_code,
                valid_from=visitor.expected_arrival,
                valid_until=visitor.expected_departure
            )
            db.add(vpass)

            event = VisitorEvent(
                visitor_id=visitor.id,
                event_type="APPROVED",
                actor_id=review.reviewer_id,
                actor_role="warden",
                details="Visit approved by warden"
            )
            db.add(event)
        else:
            visitor.status = VisitorStatus.REJECTED
            visitor.reviewed_by = f"{review.reviewer_name} ({review.reviewer_id})"
            visitor.reviewed_at = datetime.now(timezone.utc)
            visitor.rejection_reason = review.rejection_reason

            event = VisitorEvent(
                visitor_id=visitor.id,
                event_type="REJECTED",
                actor_id=review.reviewer_id,
                actor_role="warden",
                details=f"Visit rejected: {review.rejection_reason}"
            )
            db.add(event)

        db.commit()
        db.refresh(visitor)
        return visitor

    @staticmethod
    def verify_pass(db: Session, pass_code: str):
        vpass = db.query(VisitorPass).filter(VisitorPass.pass_code == pass_code).first()
        if not vpass:
            raise HTTPException(status_code=404, detail="Invalid pass: Pass code does not exist")

        if vpass.is_revoked == "TRUE":
            raise HTTPException(status_code=400, detail="Invalid pass: Pass has been revoked")

        now = datetime.now(timezone.utc)
        visitor = vpass.visitor

        # Compare naive UTC or aware UTC safely
        if vpass.valid_until.tzinfo is None:
            now_cmp = datetime.utcnow()
            valid_until_cmp = vpass.valid_until
        else:
            now_cmp = datetime.now(timezone.utc)
            valid_until_cmp = vpass.valid_until

        if now_cmp > valid_until_cmp and visitor.status not in [VisitorStatus.CHECKED_IN]:
            visitor.status = VisitorStatus.EXPIRED
            db.commit()
            raise HTTPException(status_code=400, detail="Invalid pass: Pass validity has expired")

        return {
            "valid": True,
            "pass_code": vpass.pass_code,
            "visitor_id": visitor.id,
            "visitor_name": visitor.name,
            "category": visitor.category,
            "host_student": f"{visitor.host_student_name} ({visitor.host_student_block or ''} {visitor.host_student_room or ''})",
            "purpose": visitor.purpose,
            "status": visitor.status,
            "valid_from": vpass.valid_from,
            "valid_until": vpass.valid_until
        }

    @staticmethod
    def check_in(db: Session, visitor_id: str, action: VisitorCheckInOut) -> Visitor:
        visitor = db.query(Visitor).filter(Visitor.id == visitor_id).first()
        if not visitor:
            raise HTTPException(status_code=404, detail="Visitor not found")

        if visitor.status == VisitorStatus.CHECKED_IN:
            raise HTTPException(status_code=400, detail="Duplicate check-in: Visitor is already checked in")

        if visitor.status != VisitorStatus.APPROVED:
            raise HTTPException(status_code=400, detail=f"Cannot check in visitor with status '{visitor.status}'. Pass must be APPROVED.")

        visitor.status = VisitorStatus.CHECKED_IN
        event = VisitorEvent(
            visitor_id=visitor.id,
            event_type="CHECKED_IN",
            actor_id=action.actor_id,
            actor_role=action.actor_role,
            details=f"Gate check-in recorded by {action.actor_name}. {action.notes or ''}".strip()
        )
        db.add(event)
        db.commit()
        db.refresh(visitor)
        return visitor

    @staticmethod
    def check_out(db: Session, visitor_id: str, action: VisitorCheckInOut) -> Visitor:
        visitor = db.query(Visitor).filter(Visitor.id == visitor_id).first()
        if not visitor:
            raise HTTPException(status_code=404, detail="Visitor not found")

        if visitor.status != VisitorStatus.CHECKED_IN:
            raise HTTPException(status_code=400, detail="Cannot check out: Visitor is not currently inside")

        visitor.status = VisitorStatus.CHECKED_OUT
        event = VisitorEvent(
            visitor_id=visitor.id,
            event_type="CHECKED_OUT",
            actor_id=action.actor_id,
            actor_role=action.actor_role,
            details=f"Gate check-out recorded by {action.actor_name}. {action.notes or ''}".strip()
        )
        db.add(event)
        db.commit()
        db.refresh(visitor)
        return visitor

    @staticmethod
    def get_stats(db: Session):
        now = datetime.now(timezone.utc)
        currently_inside = db.query(Visitor).filter(Visitor.status == VisitorStatus.CHECKED_IN).count()
        pending_approvals = db.query(Visitor).filter(Visitor.status == VisitorStatus.PENDING_APPROVAL).count()
        
        # Check overdue inside
        all_inside = db.query(Visitor).filter(Visitor.status == VisitorStatus.CHECKED_IN).all()
        overdue_count = 0
        for v in all_inside:
            dep = v.expected_departure.replace(tzinfo=timezone.utc) if v.expected_departure.tzinfo is None else v.expected_departure
            if now > dep:
                overdue_count += 1

        total_today = db.query(Visitor).count()
        expected_today = db.query(Visitor).filter(Visitor.status == VisitorStatus.APPROVED).count()

        return {
            "currently_inside": currently_inside,
            "expected_today": expected_today,
            "pending_approvals": pending_approvals,
            "overdue_count": overdue_count,
            "total_today": total_today
        }
