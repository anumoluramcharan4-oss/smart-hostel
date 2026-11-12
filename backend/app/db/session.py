import os
import sys
import re
import logging
from pathlib import Path
from urllib.parse import quote_plus, parse_qs, urlencode
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import declarative_base, sessionmaker

logger = logging.getLogger("smart_hostel.db")
logging.basicConfig(level=logging.INFO)

# 1. Load DATABASE_URL from backend/.env, .env.local, or root .env
backend_dir = Path(__file__).resolve().parents[2]
root_dir = Path(__file__).resolve().parents[3]

env_candidates = [
    backend_dir / ".env",
    root_dir / ".env.local",
    root_dir / ".env",
    root_dir / "frontend" / ".env.local",
]

for env_path in env_candidates:
    if env_path.exists():
        load_dotenv(dotenv_path=env_path, override=False)

raw_database_url = os.getenv("DATABASE_URL")

# Detect whether running under pytest test suite
is_testing = (
    "pytest" in sys.modules
    or "PYTEST_CURRENT_TEST" in os.environ
    or os.getenv("TESTING", "").lower() in ("true", "1")
)


def parse_and_clean_db_url(raw_url: str):
    """
    Cleans raw DATABASE_URL:
    - Normalizes postgres:// and postgresql:// to postgresql+psycopg2://
    - URL-encodes special characters in password
    - Enforces sslmode=require for PostgreSQL
    Returns (cleaned_url, dialect, host)
    """
    if not raw_url:
        return "", "none", "none"

    if raw_url.startswith("sqlite"):
        url = make_url(raw_url)
        return raw_url, "sqlite", url.host or "memory"

    url_str = raw_url.strip()
    if url_str.startswith("postgres://"):
        url_str = "postgresql+psycopg2://" + url_str[len("postgres://"):]
    elif url_str.startswith("postgresql://"):
        url_str = "postgresql+psycopg2://" + url_str[len("postgresql://"):]

    match = re.match(
        r"^(postgresql(?:\+[a-zA-Z0-9_-]+)?://)([^:]+):(.*)@([^@:/]+)(?::(\d+))?/(.+)$",
        url_str,
    )
    if match:
        prefix, user, raw_pass, host, port, db_and_query = match.groups()
        port_str = f":{port}" if port else ""
        if "?" in db_and_query:
            dbname, query_str = db_and_query.split("?", 1)
            query_params = parse_qs(query_str)
        else:
            dbname = db_and_query
            query_params = {}

        # Enforce sslmode=require
        query_params["sslmode"] = ["require"]
        flat_query = {k: v[0] for k, v in query_params.items()}
        new_query_str = urlencode(flat_query)

        # URL encode password
        safe_pass = quote_plus(raw_pass)
        clean_url = f"{prefix}{user}:{safe_pass}@{host}{port_str}/{dbname}?{new_query_str}"
        url_obj = make_url(clean_url)
        return clean_url, url_obj.get_backend_name(), url_obj.host
    else:
        url_obj = make_url(url_str)
        query = dict(url_obj.query)
        if "sslmode" not in query and url_obj.get_backend_name() == "postgresql":
            query["sslmode"] = "require"
            url_obj = url_obj.set(query=query)
        return (
            url_obj.render_as_string(hide_password=False),
            url_obj.get_backend_name(),
            url_obj.host,
        )


if raw_database_url and not is_testing:
    DATABASE_URL, DB_DIALECT, DB_HOST = parse_and_clean_db_url(raw_database_url)
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        connect_args={"options": "-csearch_path=hostel,public"},
    )
elif is_testing:
    # During tests, create in-memory SQLite (overridden per test in conftest.py)
    DATABASE_URL = "sqlite:///:memory:"
    DB_DIALECT = "sqlite"
    DB_HOST = "memory"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # In production/dev runtime: DO NOT fall back to local SQLite file
    DATABASE_URL = None
    DB_DIALECT = "none"
    DB_HOST = "none"
    engine = None

SessionLocal = (
    sessionmaker(autocommit=False, autoflush=False, bind=engine)
    if engine
    else None
)

Base = declarative_base()


def ensure_hostel_schema():
    """Ensures the 'hostel' schema exists and creates the students alias view."""
    if not engine or DB_DIALECT != "postgresql":
        return
    try:
        with engine.connect() as conn:
            conn.execute(text("CREATE SCHEMA IF NOT EXISTS hostel;"))
            conn.commit()
    except Exception as e:
        logger.warning("[DB STARTUP] Could not ensure hostel schema: %s", e)


def log_startup_counts():
    """
    On startup, logs the database dialect and host only (never the password),
    e.g. 'DB: postgresql @ db.xxxx.supabase.co'.
    """
    if not engine or not DATABASE_URL:
        logger.error("==================================================")
        logger.error("[DB STARTUP ERROR] DATABASE_URL is missing in backend/.env!")
        logger.error("Please add your Supabase Postgres connection string to backend/.env.")
        logger.error("==================================================")
        return

    logger.info("==================================================")
    logger.info("DB: %s @ %s (schema: hostel)", DB_DIALECT, DB_HOST)
    try:
        ensure_hostel_schema()
        with engine.connect() as conn:
            profile_count = conn.execute(
                text("SELECT count(*) FROM hostel.profiles WHERE role='student'")
            ).scalar()
            room_count = conn.execute(text("SELECT count(*) FROM hostel.rooms")).scalar()
            active_alloc_count = conn.execute(
                text("SELECT count(*) FROM hostel.allocations WHERE is_active=TRUE")
            ).scalar()
            logger.info(
                "[DB STARTUP] Counts -> Profiles (students): %s, Rooms: %s, Active Allocations: %s",
                profile_count,
                room_count,
                active_alloc_count,
            )
    except Exception as e:
        logger.warning("[DB STARTUP] Could not query initial counts: %s", e)
    logger.info("==================================================")


def get_db():
    if not SessionLocal:
        raise RuntimeError(
            "DATABASE_URL is missing in backend/.env. Supabase Postgres connection string is required."
        )
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
