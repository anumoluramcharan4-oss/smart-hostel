"""
Smart Hostel Backend Application
FastAPI application scaffolding with health check endpoint and module routers.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone

from backend.app.db.session import engine, Base
from backend.app.routers import visitors, assets, parcels

# Auto-create database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smart Hostel API",
    description="Smart Hostel Management System 2.0 API",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers under /api/v1
app.include_router(visitors.router, prefix="/api/v1")
app.include_router(assets.router, prefix="/api/v1")
app.include_router(parcels.router, prefix="/api/v1")


@app.get("/health", tags=["System"])
@app.get("/api/health", tags=["System"])
async def health_check():
    """
    System health check endpoint for monitoring and readiness probes.
    """
    return {
        "status": "healthy",
        "app": "Smart Hostel 2.0 API",
        "version": "2.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "services": {
            "database": "connected",
            "visitors_module": "active"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
