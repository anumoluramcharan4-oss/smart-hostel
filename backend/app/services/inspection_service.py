import secrets
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import HTTPException
from sqlalchemy.orm import Session
from backend.app.models.inspection import (
    Inspection,
    InspectionResult,
    InspectionTemplate,
    InspectionTemplateItem,
    CorrectiveAction,
    InspectionStatus,
    ItemResultStatus,
    InspectionSeverity
)
from backend.app.schemas.inspection import (
    InspectionScheduleCreate,
    InspectionExecutionSubmit
)

DEFAULT_CHECKLIST = [
    ("Floor Sweep & Mop", "CLEANLINESS", 1, InspectionSeverity.MEDIUM),
    ("Waste Disposal & Bin Cleared", "CLEANLINESS", 1, InspectionSeverity.LOW),
    ("Bathroom & Toilet Hygiene", "CLEANLINESS", 2, InspectionSeverity.HIGH),
    ("Ceiling Lights & Fan Operational", "ELECTRICAL", 2, InspectionSeverity.HIGH),
    ("Study Table & Chair Condition", "FURNITURE", 1, InspectionSeverity.MEDIUM),
    ("Plumbing Fixtures & Tap Leakage", "PLUMBING", 2, InspectionSeverity.HIGH),
    ("Window Latches & Door Locks", "SAFETY", 3, InspectionSeverity.CRITICAL),
]

class InspectionService:
    @staticmethod
    def ensure_default_template(db: Session) -> InspectionTemplate:
        template = db.query(InspectionTemplate).first()
        if not template:
            template = InspectionTemplate(
                title="Comprehensive Dorm Room Cleanliness & Fixture Inspection",
                description="Standard hygiene, electrical safety, plumbing, and asset checklist."
            )
            db.add(template)
            db.flush()

            for name, cat, weight, sev in DEFAULT_CHECKLIST:
                item = InspectionTemplateItem(
                    template_id=template.id,
                    criterion_name=name,
                    category=cat,
                    weight=weight,
                    severity=sev
                )
                db.add(item)
            db.commit()
            db.refresh(template)
        return template

    @staticmethod
    def schedule_inspection(db: Session, data: InspectionScheduleCreate) -> Inspection:
        template = InspectionService.ensure_default_template(db)
        template_id = data.template_id or template.id
        ref = f"INS-{datetime.now().year}-{secrets.randbelow(9000) + 1000}"

        inspection = Inspection(
            inspection_ref=ref,
            template_id=template_id,
            building="Main Campus",
            block=data.block,
            floor=data.floor,
            room_number=data.room_number,
            inspector_id=data.inspector_id,
            inspector_name=data.inspector_name,
            scheduled_date=data.scheduled_date,
            status=InspectionStatus.SCHEDULED,
            general_notes=data.general_notes
        )
        db.add(inspection)
        db.commit()
        db.refresh(inspection)
        return inspection

    @staticmethod
    def submit_execution(db: Session, inspection_id: str, submission: InspectionExecutionSubmit) -> Inspection:
        inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
        if not inspection:
            raise HTTPException(status_code=404, detail="Inspection record not found")

        if inspection.status == InspectionStatus.COMPLETED:
            raise HTTPException(status_code=400, detail="Inspection is already submitted and locked against modification")

        # Cleanliness Scoring formula:
        # Sum scored items (excluding NOT_APPLICABLE). PASS = 100%, NEEDS_ATTENTION = 50%, FAIL = 0%
        total_evaluable = 0
        total_score_sum = 0.0
        critical_failure = False
        failures: List[InspectionResult] = []

        for item_in in submission.results:
            is_flagged = "FALSE"
            if item_in.result in [ItemResultStatus.FAIL, ItemResultStatus.NEEDS_ATTENTION]:
                is_flagged = "TRUE"

            if item_in.result == ItemResultStatus.FAIL and item_in.severity == InspectionSeverity.CRITICAL:
                critical_failure = True

            result_obj = InspectionResult(
                inspection_id=inspection.id,
                criterion_name=item_in.criterion_name,
                category=item_in.category,
                result=item_in.result,
                notes=item_in.notes,
                flagged_issue=is_flagged
            )
            db.add(result_obj)

            if item_in.result != ItemResultStatus.NOT_APPLICABLE:
                total_evaluable += 1
                if item_in.result == ItemResultStatus.PASS:
                    total_score_sum += 100.0
                elif item_in.result == ItemResultStatus.NEEDS_ATTENTION:
                    total_score_sum += 50.0

            if is_flagged == "TRUE":
                failures.append(result_obj)

        final_score = round(total_score_sum / total_evaluable, 1) if total_evaluable > 0 else 100.0

        # Pass/Fail determination
        overall = "PASS"
        if final_score < 70.0 or critical_failure:
            overall = "FAIL"

        inspection.cleanliness_score = final_score
        inspection.overall_result = overall
        inspection.completed_at = datetime.now(timezone.utc)
        inspection.status = InspectionStatus.COMPLETED if overall == "PASS" else InspectionStatus.FOLLOW_UP_REQUIRED
        inspection.general_notes = submission.general_notes

        # Automated Corrective Actions generation:
        # 1. Cleaning failure -> Housekeeping dispatch task
        # 2. Electrical / Plumbing / Furniture failure -> Staff & Maintenance ticket
        for fail in failures:
            action_type = "HOUSEKEEPING_DISPATCH" if fail.category == "CLEANLINESS" else "MAINTENANCE_TICKET"
            assignee = "Housekeeping Staff" if fail.category == "CLEANLINESS" else "Maintenance Supervisor"
            ticket_id = f"MNT-INSP-{secrets.token_hex(3).upper()}" if action_type == "MAINTENANCE_TICKET" else None

            action = CorrectiveAction(
                inspection_id=inspection.id,
                criterion_name=fail.criterion_name,
                action_type=action_type,
                assignee=assignee,
                priority="urgent" if critical_failure else "high",
                linked_maintenance_ticket_id=ticket_id,
                status="OPEN",
                resolution_notes=f"Auto-generated from inspection finding: {fail.notes or 'Remediation required'}"
            )
            db.add(action)

        db.commit()
        db.refresh(inspection)
        return inspection

    @staticmethod
    def get_stats(db: Session):
        scheduled = db.query(Inspection).filter(Inspection.status == InspectionStatus.SCHEDULED).count()
        completed = db.query(Inspection).filter(Inspection.status == InspectionStatus.COMPLETED).count()
        failed = db.query(Inspection).filter(
            (Inspection.overall_result == "FAIL") | (Inspection.status == InspectionStatus.FOLLOW_UP_REQUIRED)
        ).count()
        overdue = db.query(Inspection).filter(Inspection.status == InspectionStatus.OVERDUE).count()

        all_scored = db.query(Inspection).filter(Inspection.cleanliness_score != None).all()
        avg_score = round(sum(i.cleanliness_score for i in all_scored) / len(all_scored), 1) if all_scored else 88.5

        return {
            "scheduled_count": scheduled,
            "completed_count": completed,
            "failed_count": failed,
            "overdue_count": overdue,
            "average_cleanliness_score": avg_score
        }
