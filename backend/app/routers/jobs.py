import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import User, Job
from app.schemas.job import JobCreate, JobResponse
from app.routers.auth import get_current_user
from app.services.job_analyzer import parse_job_description

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.post("", response_model=JobResponse)
async def create_job(
    data: JobCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not data.title.strip() or not data.description.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job title and description cannot be empty."
        )

    parsed_reqs = await parse_job_description(data.title, data.company, data.description)

    job_obj = Job(
        user_id=current_user.id,
        title=data.title.strip(),
        company=data.company.strip() or "Tech Company",
        url=data.url.strip() if data.url else "",
        description=data.description.strip(),
        requirements_json=json.dumps(parsed_reqs)
    )
    db.add(job_obj)
    db.commit()
    db.refresh(job_obj)

    return JobResponse(
        id=job_obj.id,
        user_id=job_obj.user_id,
        title=job_obj.title,
        company=job_obj.company,
        url=job_obj.url,
        description=job_obj.description,
        requirements=parsed_reqs,
        created_at=job_obj.created_at
    )

@router.get("", response_model=List[JobResponse])
def get_user_jobs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    jobs = db.query(Job).filter(Job.user_id == current_user.id).order_by(Job.created_at.desc()).all()
    results = []
    for j in jobs:
        results.append(JobResponse(
            id=j.id,
            user_id=j.user_id,
            title=j.title,
            company=j.company,
            url=j.url,
            description=j.description,
            requirements=j.get_requirements(),
            created_at=j.created_at
        ))
    return results

@router.get("/{job_id}", response_model=JobResponse)
def get_job_by_id(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job_obj = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    if not job_obj:
        raise HTTPException(status_code=404, detail="Job description not found")
    
    return JobResponse(
        id=job_obj.id,
        user_id=job_obj.user_id,
        title=job_obj.title,
        company=job_obj.company,
        url=job_obj.url,
        description=job_obj.description,
        requirements=job_obj.get_requirements(),
        created_at=job_obj.created_at
    )

@router.delete("/{job_id}")
def delete_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job_obj = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    if not job_obj:
        raise HTTPException(status_code=404, detail="Job description not found")
    
    db.delete(job_obj)
    db.commit()
    return {"message": "Job description deleted successfully", "id": job_id}

@router.post("/sample", response_model=JobResponse)
async def create_sample_job(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a realistic sample job description for instant testing."""
    sample_desc = """
Job Title: Senior Full-Stack Engineer (Python / React)
Company: StripeStream Technologies
Location: Remote / San Francisco, CA

About the Role:
We are seeking a high-caliber Senior Full-Stack Engineer to architect, build, and scale our core SaaS platform. You will be responsible for creating high-performance web applications and resilient microservices handling millions of daily events.

Key Responsibilities:
- Build modern, interactive user interfaces with React.js, Next.js, and TypeScript.
- Design high-performance asynchronous REST and WebSocket backend services using Python and FastAPI.
- Architect and optimize PostgreSQL databases, query indexes, and Redis caching layers.
- Deploy containerized applications to AWS using Docker and CI/CD pipelines.
- Collaborate with product designers and cross-functional teams in an agile environment.

Requirements:
- 3+ years of professional software engineering experience.
- Strong proficiency in Python, FastAPI or Django, and modern JavaScript/TypeScript.
- Deep hands-on experience with React.js, Next.js, and modern CSS (Tailwind).
- Solid understanding of relational databases (PostgreSQL) and database optimization.
- Experience with Docker, Git, CI/CD, and Cloud Deployment (AWS or GCP).
- Excellent communication and problem-solving skills.

Nice to Have / Preferred:
- Experience with Kubernetes and Terraform.
- Familiarity with GraphQL, WebSockets, or AI/LLM integration.
- BS/MS in Computer Science or equivalent practical experience.
"""
    parsed_reqs = await parse_job_description("Senior Full-Stack Engineer", "StripeStream Technologies", sample_desc)

    job_obj = Job(
        user_id=current_user.id,
        title="Senior Full-Stack Engineer",
        company="StripeStream Technologies",
        url="https://stripestream.example.com/careers/senior-fullstack",
        description=sample_desc,
        requirements_json=json.dumps(parsed_reqs)
    )
    db.add(job_obj)
    db.commit()
    db.refresh(job_obj)

    return JobResponse(
        id=job_obj.id,
        user_id=job_obj.user_id,
        title=job_obj.title,
        company=job_obj.company,
        url=job_obj.url,
        description=job_obj.description,
        requirements=parsed_reqs,
        created_at=job_obj.created_at
    )
