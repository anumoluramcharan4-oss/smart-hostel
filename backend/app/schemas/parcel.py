from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from backend.app.models.parcel import ParcelStatus

class ParcelBase(BaseModel):
    recipient_student_id: str
    recipient_name: str
    recipient_room: Optional[str] = None
    recipient_block: Optional[str] = None
    courier: str = Field(..., min_length=2, max_length=100)
    tracking_number: Optional[str] = None
    storage_location: str = Field(..., min_length=2, max_length=50) # e.g. Shelf A-3
    locker_number: Optional[str] = None
    notes: Optional[str] = None

class ParcelCreate(ParcelBase):
    pass

class ParcelPickupVerification(BaseModel):
    parcel_ref: str
    pickup_code: str
    staff_id: str
    staff_name: str

class ParcelEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    parcel_id: str
    event_type: str
    actor_id: str
    actor_role: str
    timestamp: datetime
    details: Optional[str] = None

class ParcelResponse(ParcelBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    parcel_ref: str
    received_by: str
    status: ParcelStatus
    collected_at: Optional[datetime] = None
    handed_over_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    # Note: Secret pickup codes are excluded from general list endpoints for security
    events: List[ParcelEventResponse] = []

class StudentParcelResponse(ParcelResponse):
    # Only returned to the recipient student themselves
    active_pickup_code: Optional[str] = None

class ParcelStats(BaseModel):
    awaiting_collection: int
    collected_today: int
    overdue_count: int
    total_received: int
