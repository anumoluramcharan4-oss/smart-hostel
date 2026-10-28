"""
Smart Hostel Backend Application
FastAPI application scaffolding with health check endpoint.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone

app = FastAPI(
    title="Smart Hostel API",
    description="AI-Powered Hostel Management System API",
    version="1.0.0",
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


@app.get("/health", tags=["System"])
@app.get("/api/health", tags=["System"])
async def health_check():
    """
    System health check endpoint for monitoring and readiness probes.
    """
    return {
        "status": "healthy",
        "app": "Smart Hostel API",
        "version": "1.0.0",
        "stage": "Stage 1: Frontend Prototype & Architecture Scaffolding",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "services": {
            "database": "scaffolded",
            "ai_engine": "ready_for_stage_5",
            "auth": "ready_for_stage_2"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
