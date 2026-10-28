"""
Smart Hostel Backend Entrypoint
Re-exports FastAPI app from backend.app.main with CORS for frontend on port 3000.
"""
from backend.app.main import app

__all__ = ["app"]
