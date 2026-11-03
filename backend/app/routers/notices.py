"""Notices router for Smart Hostel"""
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from pydantic import BaseModel

from backend.app.db.session import get_db
from backend.app.models.hostel import Notice

router = APIRouter(tags=["Notices"])


class NoticeCreate(BaseModel):
    title: str
    content: str
    category: Optional[str] = "general"
    priority: Optional[str] = "normal"
    author: Optional[str] = "Hostel Administration"


@router.get("/notices")
@router.get("/api/notices")
def get_notices(db: Session = Depends(get_db)):
    notices = db.query(Notice).order_by(Notice.created_at.desc()).all()
    return [
        {
            "id": n.id,
            "title": n.title,
            "content": n.content,
            "category": n.category,
            "priority": n.priority,
            "author": n.author,
            "targetAudience": n.target_audience,
            "createdAt": n.created_at.isoformat() if n.created_at else "",
            "date": n.created_at.strftime("%Y-%m-%d") if n.created_at else "",
        }
        for n in notices
    ]


@router.post("/notices")
@router.post("/api/notices")
def create_notice(payload: NoticeCreate, db: Session = Depends(get_db)):
    import uuid
    n = Notice(
        id=f"not-{str(uuid.uuid4())[:8]}",
        title=payload.title,
        content=payload.content,
        category=payload.category or "general",
        priority=payload.priority or "normal",
        author=payload.author or "Hostel Administration",
        created_at=datetime.now(timezone.utc),
    )
    db.add(n)
    db.commit()
    db.refresh(n)
    return {
        "id": n.id,
        "title": n.title,
        "content": n.content,
        "category": n.category,
        "priority": n.priority,
        "author": n.author,
        "createdAt": n.created_at.isoformat(),
    }

