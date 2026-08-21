from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import os

from app.core.config import settings
from app.database.database import engine, Base
# Import all models to ensure metadata registration
from app.database import models

# Initialize tables
Base.metadata.create_all(bind=engine)

# Auto-migrate new columns if using existing SQLite or PostgreSQL DB
def auto_migrate():
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            # Check resumes table columns
            for col, col_type in [
                ("source_type", "VARCHAR(50) DEFAULT 'UPLOAD'"),
                ("template_name", "VARCHAR(50) DEFAULT 'modern'"),
                ("styling_config", "TEXT DEFAULT '{}'")
            ]:
                try:
                    conn.execute(text(f"ALTER TABLE resumes ADD COLUMN {col} {col_type}"))
                    conn.commit()
                except Exception:
                    pass
    except Exception as e:
        print(f"[Auto-Migrate] {e}")

auto_migrate()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="NextHire — AI Resume Analyzer, Recruiter Simulation, Interview Coach & Real-Time Copilot API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Uploads directory
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers
from app.routers import (
    auth, users, resumes, jobs, analysis,
    interviews, preparation, copilot, improvements
)

app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(resumes.router, prefix=settings.API_V1_STR)
app.include_router(jobs.router, prefix=settings.API_V1_STR)
app.include_router(analysis.router, prefix=settings.API_V1_STR)
app.include_router(interviews.router, prefix=settings.API_V1_STR)
app.include_router(preparation.router, prefix=settings.API_V1_STR)
app.include_router(copilot.router, prefix=settings.API_V1_STR)
app.include_router(improvements.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "NextHire — AI Resume Analyzer API",
        "docs": "/docs",
        "health": "/api/health"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "NextHire AI Resume Analyzer API",
        "version": "1.0.0",
        "ai_provider": settings.AI_PROVIDER,
        "database": "connected"
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"[Global Exception] {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again or check parameters."}
    )
