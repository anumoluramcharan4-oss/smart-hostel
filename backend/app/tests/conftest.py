import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.main import app
from backend.app.db.session import Base, get_db

# Import all models so that Base.metadata contains all tables
import backend.app.models.hostel  # noqa: F401
import backend.app.models.asset  # noqa: F401
import backend.app.models.inspection  # noqa: F401
import backend.app.models.laundry  # noqa: F401
import backend.app.models.parcel  # noqa: F401
import backend.app.models.visitor  # noqa: F401


@pytest.fixture(autouse=True)
def test_db_lifecycle():
    """
    Fresh in-memory SQLite engine with StaticPool per test.
    Creates all tables before the test and drops all tables after.
    Overrides get_db at the start of each test and cleans it up after.
    """
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    yield TestingSessionLocal

    app.dependency_overrides.pop(get_db, None)
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture
def db(test_db_lifecycle):
    """Provides a database session bound to the active in-memory test database."""
    session = test_db_lifecycle()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    """Provides a TestClient targeting the FastAPI application."""
    return TestClient(app)
