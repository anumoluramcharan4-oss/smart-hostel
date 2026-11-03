import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

from pathlib import Path

logger = logging.getLogger("smart_hostel.db")
logging.basicConfig(level=logging.INFO)

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    project_root = Path(__file__).resolve().parents[3]
    default_sqlite_path = project_root / "smart_hostel.db"
    DATABASE_URL = f"sqlite:///{default_sqlite_path}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def log_startup_counts():
    try:
        with engine.connect() as conn:
            profile_count = conn.execute(text("SELECT count(*) FROM profiles WHERE role='student'")).scalar()
            room_count = conn.execute(text("SELECT count(*) FROM rooms")).scalar()
            active_alloc_count = conn.execute(text("SELECT count(*) FROM allocations WHERE is_active=TRUE")).scalar()
            logger.info("==================================================")
            logger.info("[DB STARTUP] Resolved DB Path: %s", DATABASE_URL)
            logger.info("[DB STARTUP] Counts -> Profiles (students): %s, Rooms: %s, Active Allocations: %s", profile_count, room_count, active_alloc_count)
            logger.info("==================================================")
    except Exception as e:
        logger.warning("[DB STARTUP] Could not query initial counts: %s", e)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
