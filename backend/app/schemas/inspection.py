from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from backend.app.models.inspection import (
    InspectionStatus,
    ItemResultStatus,
    InspectionSeverity
)

class InspectionItemResultInput(BaseModel):
    criterion_name: str
    category: str
    result: ItemResultStatus
    notes: Optional[str] = None
    severity: InspectionSeverity = InspectionSeverity.MEDIUM

class InspectionScheduleCreate(BaseModel):
    template_id: Optional[str] = None
    block: str
    floor: int = 1
    room_number: str
    inspector_id: str
    inspector_name: str
    scheduled_date: str # YYYY-MM-DD
    general_notes: Optional[str] = None

class InspectionExecutionSubmit(BaseModel):
    results: List[InspectionItemResultInput]
    general_notes: Optional[str] = None

class CorrectiveActionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    inspection_id: str
    criterion_name: str
    action_type: str
    assignee: str
    priority: str
    linked_maintenance_ticket_id: Optional[str] = None
    status: str
    resolution_notes: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

class InspectionResultResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    criterion_name: str
    category: str
    result: ItemResultStatus
    notes: Optional[str] = None
    flagged_issue: str

class InspectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    inspection_ref: str
    template_id: str
    building: str
    block: str
    floor: int
    room_number: str
    inspector_id: str
    inspector_name: str
    scheduled_date: str
    completed_at: Optional[datetime] = None
    cleanliness_score: Optional[float] = None
    overall_result: str
    status: InspectionStatus
    general_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    results: List[InspectionResultResponse] = []
    corrective_actions: List[CorrectiveActionResponse] = []

class InspectionStats(BaseModel):
    scheduled_count: int
    completed_count: int
    failed_count: int
    overdue_count: int
    average_cleanliness_score: float
