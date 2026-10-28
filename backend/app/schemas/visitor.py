from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from backend.app.models.visitor import VisitorStatus, VisitorCategory

class VisitorBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=7, max_length=20)
    email: Optional[str] = None
    id_proof_type: Optional[str] = None
    id_proof_number: Optional[str] = None
    category: VisitorCategory = VisitorCategory.PARENT
    host_student_id: str
    host_student_name: str
    host_student_room: Optional[str] = None
    host_student_block: Optional[str] = None
    purpose: str = Field(..., min_length=3, max_length=255)
    expected_arrival: datetime
    expected_departure: datetime
    notes: Optional[str] = None

class VisitorCreate(VisitorBase):
    pass

class VisitorReview(BaseModel):
    approved: bool
    reviewer_id: str
    reviewer_name: str
    rejection_reason: Optional[str] = None

class VisitorCheckInOut(BaseModel):
    actor_id: str
    actor_name: str
    actor_role: str = "security"
    notes: Optional[str] = None

class PassVerificationRequest(BaseModel):
    pass_code: str

class VisitorPassResponse(BaseModel):
    id: str
    visitor_id: str
    pass_code: str
    valid_from: datetime
    valid_until: datetime
    is_revoked: str
    created_at: datetime

    class Config:
        from_attributes = True

class VisitorEventResponse(BaseModel):
    id: str
    visitor_id: str
    event_type: str
    actor_id: str
    actor_role: str
    timestamp: datetime
    details: Optional[str] = None

    class Config:
        from_attributes = True

class VisitorResponse(VisitorBase):
    id: str
    status: VisitorStatus
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    passes: List[VisitorPassResponse] = []
    events: List[VisitorEventResponse] = []

    class Config:
        from_attributes = True

class VisitorStats(BaseModel):
    currently_inside: int
    expected_today: int
    pending_approvals: int
    overdue_count: int
    total_today: int
