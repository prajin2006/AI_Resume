import os
import uuid
import json
from typing import List, Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import User, Resume, ResumeSection, Analysis
from app.schemas.resume import (
    ResumeCreate, ResumeUpdate, ResumeResponse, ResumeListResponse,
    AIAssistRequest, AIAssistResponse
)
from app.routers.auth import get_current_user
from app.utils.file_validation import validate_uploaded_file, sanitize_filename
from app.services.resume_parser import (
    extract_text_from_pdf, extract_text_from_docx, extract_text_from_image,
    parse_resume, generate_raw_text_from_data
)
from app.ai.llm_service import llm_service, clean_json_response
from app.core.config import settings

router = APIRouter(prefix="/resumes", tags=["Resumes"])

@router.post("", response_model=ResumeResponse)
async def create_builder_resume(
    data: ResumeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new resume from the AI Resume Builder."""
    data_dict = data.data.model_dump()
    raw_text = generate_raw_text_from_data(data_dict)
    clean_name = sanitize_filename(data.filename or "Untitled_Resume")
    if not clean_name.endswith(".pdf") and not clean_name.endswith(".docx"):
        clean_name = f"{clean_name}.pdf"

    # Virtual file path
    unique_filename = f"builder_{uuid.uuid4().hex[:8]}_{clean_name}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(raw_text)

    resume_obj = Resume(
        user_id=current_user.id,
        filename=clean_name,
        file_path=file_path,
        file_type="pdf",
        file_size=len(raw_text.encode('utf-8')),
        source_type="BUILDER",
        template_name=data.template_name or "modern",
        styling_config=json.dumps(data.styling_config or {}),
        raw_text=raw_text,
        parsed_data=json.dumps(data_dict)
    )
    db.add(resume_obj)
    db.commit()
    db.refresh(resume_obj)

    # Save sections
    for sec_name, sec_val in data_dict.items():
        if sec_val:
            sec_record = ResumeSection(
                resume_id=resume_obj.id,
                section_name=sec_name,
                content=str(sec_val) if isinstance(sec_val, str) else json.dumps(sec_val),
                structured_json=json.dumps(sec_val) if isinstance(sec_val, (dict, list)) else "{}"
            )
            db.add(sec_record)
    db.commit()

    return ResumeResponse(
        id=resume_obj.id,
        user_id=resume_obj.user_id,
        filename=resume_obj.filename,
        file_type=resume_obj.file_type,
        file_size=resume_obj.file_size,
        source_type=resume_obj.source_type or "BUILDER",
        template_name=resume_obj.template_name or "modern",
        styling_config=json.loads(resume_obj.styling_config or "{}"),
        raw_text=resume_obj.raw_text,
        parsed_data=resume_obj.get_parsed(),
        is_active=resume_obj.is_active,
        created_at=resume_obj.created_at,
        updated_at=resume_obj.updated_at
    )

@router.post("/upload", response_model=ResumeResponse)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload PDF, DOCX, or Image resume."""
    content = await file.read()
    file_type = validate_uploaded_file(file, content)

    clean_name = sanitize_filename(file.filename or "resume.pdf")
    unique_filename = f"{uuid.uuid4().hex}_{clean_name}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as f:
        f.write(content)

    if file_type == "pdf":
        raw_text = await extract_text_from_pdf(content)
    elif file_type == "image":
        raw_text = await extract_text_from_image(content)
    else:
        raw_text = await extract_text_from_docx(content)

    if not raw_text or not raw_text.strip():
        raw_text = await extract_text_from_image(content)

    parsed_dict = await parse_resume(raw_text)

    resume_obj = Resume(
        user_id=current_user.id,
        filename=clean_name,
        file_path=file_path,
        file_type=file_type,
        file_size=len(content),
        source_type="UPLOAD",
        template_name="modern",
        styling_config="{}",
        raw_text=raw_text,
        parsed_data=json.dumps(parsed_dict)
    )
    db.add(resume_obj)
    db.commit()
    db.refresh(resume_obj)

    for sec_name, sec_val in parsed_dict.items():
        if sec_val:
            sec_record = ResumeSection(
                resume_id=resume_obj.id,
                section_name=sec_name,
                content=str(sec_val) if isinstance(sec_val, str) else json.dumps(sec_val),
                structured_json=json.dumps(sec_val) if isinstance(sec_val, (dict, list)) else "{}"
            )
            db.add(sec_record)
    db.commit()

    return ResumeResponse(
        id=resume_obj.id,
        user_id=resume_obj.user_id,
        filename=resume_obj.filename,
        file_type=resume_obj.file_type,
        file_size=resume_obj.file_size,
        source_type=resume_obj.source_type or "UPLOAD",
        template_name=resume_obj.template_name or "modern",
        styling_config=json.loads(resume_obj.styling_config or "{}"),
        raw_text=resume_obj.raw_text,
        parsed_data=parsed_dict,
        is_active=resume_obj.is_active,
        created_at=resume_obj.created_at,
        updated_at=resume_obj.updated_at
    )

@router.get("", response_model=List[ResumeListResponse])
def get_user_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all resumes belonging to the authenticated user."""
    resumes = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.updated_at.desc()).all()
    results = []
    for r in resumes:
        p = r.get_parsed()
        cand_name = p.get("contact", {}).get("name", "")
        cand_title = p.get("contact", {}).get("title", "") or (p.get("experience", [{}])[0].get("title", "") if p.get("experience") else "")
        skills_count = len(p.get("skills", []))
        exp_years = float(p.get("total_years_experience", 0.0))

        # Check for latest analysis score
        latest_analysis = db.query(Analysis).filter(Analysis.resume_id == r.id).order_by(Analysis.created_at.desc()).first()

        results.append(ResumeListResponse(
            id=r.id,
            filename=r.filename,
            file_type=r.file_type,
            file_size=r.file_size,
            source_type=getattr(r, "source_type", "UPLOAD") or "UPLOAD",
            template_name=getattr(r, "template_name", "modern") or "modern",
            created_at=r.created_at,
            updated_at=r.updated_at,
            candidate_name=cand_name,
            candidate_title=cand_title,
            skills_count=skills_count,
            experience_years=exp_years,
            latest_overall_score=latest_analysis.overall_score if latest_analysis else None,
            latest_ats_score=latest_analysis.ats_score if latest_analysis else None,
            latest_job_title=latest_analysis.job.title if (latest_analysis and latest_analysis.job) else None
        ))
    return results

@router.get("/{resume_id}", response_model=ResumeResponse)
def get_resume_by_id(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve single resume with strict authorization check."""
    resume_obj = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume_obj:
        raise HTTPException(status_code=404, detail="Resume not found")
    if resume_obj.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied. You can only access your own resumes.")
    
    return ResumeResponse(
        id=resume_obj.id,
        user_id=resume_obj.user_id,
        filename=resume_obj.filename,
        file_type=resume_obj.file_type,
        file_size=resume_obj.file_size,
        source_type=getattr(resume_obj, "source_type", "UPLOAD") or "UPLOAD",
        template_name=getattr(resume_obj, "template_name", "modern") or "modern",
        styling_config=json.loads(getattr(resume_obj, "styling_config", "{}") or "{}"),
        raw_text=resume_obj.raw_text,
        parsed_data=resume_obj.get_parsed(),
        is_active=resume_obj.is_active,
        created_at=resume_obj.created_at,
        updated_at=resume_obj.updated_at
    )

@router.put("/{resume_id}", response_model=ResumeResponse)
def update_resume(
    resume_id: int,
    data: ResumeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update resume content, template, or styling (with strict authorization)."""
    resume_obj = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume_obj:
        raise HTTPException(status_code=404, detail="Resume not found")
    if resume_obj.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied. You can only modify your own resumes.")

    if data.filename:
        resume_obj.filename = sanitize_filename(data.filename)
    if data.template_name:
        resume_obj.template_name = data.template_name
    if data.styling_config is not None:
        resume_obj.styling_config = json.dumps(data.styling_config)

    if data.data:
        data_dict = data.data.model_dump()
        raw_text = generate_raw_text_from_data(data_dict)
        resume_obj.parsed_data = json.dumps(data_dict)
        resume_obj.raw_text = raw_text
        resume_obj.file_size = len(raw_text.encode('utf-8'))

        # Update sections
        db.query(ResumeSection).filter(ResumeSection.resume_id == resume_id).delete()
        for sec_name, sec_val in data_dict.items():
            if sec_val:
                sec_record = ResumeSection(
                    resume_id=resume_obj.id,
                    section_name=sec_name,
                    content=str(sec_val) if isinstance(sec_val, str) else json.dumps(sec_val),
                    structured_json=json.dumps(sec_val) if isinstance(sec_val, (dict, list)) else "{}"
                )
                db.add(sec_record)

    resume_obj.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(resume_obj)

    return ResumeResponse(
        id=resume_obj.id,
        user_id=resume_obj.user_id,
        filename=resume_obj.filename,
        file_type=resume_obj.file_type,
        file_size=resume_obj.file_size,
        source_type=getattr(resume_obj, "source_type", "BUILDER") or "BUILDER",
        template_name=getattr(resume_obj, "template_name", "modern") or "modern",
        styling_config=json.loads(getattr(resume_obj, "styling_config", "{}") or "{}"),
        raw_text=resume_obj.raw_text,
        parsed_data=resume_obj.get_parsed(),
        is_active=resume_obj.is_active,
        created_at=resume_obj.created_at,
        updated_at=resume_obj.updated_at
    )

@router.delete("/{resume_id}")
def delete_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Permanently delete resume and all associated analysis records safely."""
    resume_obj = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume_obj:
        raise HTTPException(status_code=404, detail="Resume not found")
    if resume_obj.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied. You can only delete your own resumes.")

    # Remove stored file if on disk
    try:
        if resume_obj.file_path and os.path.exists(resume_obj.file_path):
            os.remove(resume_obj.file_path)
    except Exception:
        pass

    db.delete(resume_obj)
    db.commit()

    return {
        "success": True,
        "message": f"Resume '{resume_obj.filename}' deleted successfully",
        "id": resume_id
    }

@router.post("/{resume_id}/duplicate", response_model=ResumeResponse)
def duplicate_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Duplicate an existing resume as a copy with unique ID."""
    orig = db.query(Resume).filter(Resume.id == resume_id).first()
    if not orig:
        raise HTTPException(status_code=404, detail="Original resume not found")
    if orig.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied. You can only duplicate your own resumes.")

    base_name = orig.filename.rsplit(".", 1)[0]
    ext = orig.filename.rsplit(".", 1)[1] if "." in orig.filename else "pdf"
    new_filename = f"{base_name}_Copy.{ext}"

    dup_resume = Resume(
        user_id=current_user.id,
        filename=new_filename,
        file_path=orig.file_path,
        file_type=orig.file_type,
        file_size=orig.file_size,
        source_type=getattr(orig, "source_type", "BUILDER") or "BUILDER",
        template_name=getattr(orig, "template_name", "modern") or "modern",
        styling_config=getattr(orig, "styling_config", "{}") or "{}",
        raw_text=orig.raw_text,
        parsed_data=orig.parsed_data
    )
    db.add(dup_resume)
    db.commit()
    db.refresh(dup_resume)

    return ResumeResponse(
        id=dup_resume.id,
        user_id=dup_resume.user_id,
        filename=dup_resume.filename,
        file_type=dup_resume.file_type,
        file_size=dup_resume.file_size,
        source_type=dup_resume.source_type,
        template_name=dup_resume.template_name,
        styling_config=json.loads(dup_resume.styling_config or "{}"),
        raw_text=dup_resume.raw_text,
        parsed_data=dup_resume.get_parsed(),
        is_active=dup_resume.is_active,
        created_at=dup_resume.created_at,
        updated_at=dup_resume.updated_at
    )

@router.post("/ai/assist", response_model=AIAssistResponse)
async def ai_resume_assist(
    req: AIAssistRequest,
    current_user: User = Depends(get_current_user)
):
    """
    AI Content Assistant for Resume Builder:
    - Generate summary from candidate skills & title
    - Improve bullet points (STAR method)
    - Suggest relevant skills based on job title
    - Make concise / ATS friendly
    Preserves strict factual truth.
    """
    action = req.action.lower()
    text = req.text.strip() if req.text else ""
    ctx = req.context or {}

    if action in ["generate_summary", "improve_summary"]:
        title = ctx.get("title") or "Software Engineer"
        skills = ", ".join(ctx.get("skills", [])[:6]) or "modern web development"
        exps = [e.get("title") for e in ctx.get("experience", []) if e.get("title")]
        exp_str = ", ".join(exps[:3]) if exps else "technical projects"

        prompt = f"""
Candidate Info:
Role/Title: {title}
Skills: {skills}
Experience: {exp_str}
Existing draft: {text}

Write a high-impact, professional 3-sentence resume summary adhering to modern ATS standards.
CRITICAL: Do NOT invent fake companies, degrees, or false metrics. Focus on proven strengths in {skills}.
"""
        res = await llm_service.generate_completion(
            system_prompt="You are a professional resume writer. Write impactful, factual summaries.",
            user_prompt=prompt,
            temperature=0.2
        )
        out_text = res.strip() if res else f"Results-driven {title} with proven expertise in {skills}. Experienced in designing scalable architectures, building clean APIs, and delivering high-quality full-stack applications with strong problem-solving capabilities."
        return AIAssistResponse(result=out_text)

    elif action in ["improve_bullet", "make_ats_friendly", "make_concise"]:
        if not text:
            raise HTTPException(status_code=400, detail="Text input is required to improve bullet.")

        prompt = f"""
Rewrite this resume bullet point into professional action-oriented language using the Google XYZ framework (Accomplished X, measured by Y, by doing Z).
CRITICAL:
1. Preserve factual truth. Do NOT invent technologies, tools, or fake numbers that the user did not mention.
2. Start with a strong action verb (e.g. Engineered, Architected, Optimized, Implemented).

Original text: "{text}"
"""
        res = await llm_service.generate_completion(
            system_prompt="You are an expert resume editor. Elevate impact without inventing fake information.",
            user_prompt=prompt,
            temperature=0.2
        )
        improved = res.strip().strip('"').strip('-*• ') if res else f"Architected and implemented {text}, improving code maintainability and system performance."
        return AIAssistResponse(result=improved)

    elif action == "suggest_skills":
        title = ctx.get("title") or text or "Full Stack Developer"
        prompt = f"""
Given the target role '{title}', suggest 10-12 relevant, highly-sought-after technical and soft skills.
Output a JSON array of skill strings only. Example: ["React.js", "Python", "FastAPI", "PostgreSQL", "Docker", "REST APIs", "Git"]
"""
        res = await llm_service.generate_completion(
            system_prompt="You are a technical recruiter. Return a clean JSON array of relevant skills.",
            user_prompt=prompt,
            temperature=0.2
        )
        suggestions = ["React.js", "Python", "FastAPI", "PostgreSQL", "Docker", "TypeScript", "REST APIs", "Git", "Redis", "CI/CD"]
        if res:
            try:
                parsed = json.loads(clean_json_response(res))
                if isinstance(parsed, list) and len(parsed) > 0:
                    suggestions = parsed
            except Exception:
                pass
        return AIAssistResponse(result="Suggested skills", suggestions=suggestions)

    return AIAssistResponse(result=text or "Done")

@router.post("/sample", response_model=ResumeResponse)
async def create_sample_resume(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate sample software engineer resume."""
    sample_text = """
Alex Mercer
alex.mercer.dev@example.com | (555) 342-8921 | San Francisco, CA
https://linkedin.com/in/alexmercer-dev | https://github.com/alexmercer-dev

PROFESSIONAL SUMMARY
Full-Stack Software Engineer with 3+ years of experience building scalable web applications, real-time architectures, and high-throughput REST APIs using React.js, TypeScript, Python, FastAPI, and PostgreSQL. Passionate about clean code, performance optimization, and developer tooling.

TECHNICAL SKILLS
- Languages: Python, TypeScript, JavaScript, SQL, HTML5, CSS3
- Frameworks & Libraries: React.js, Next.js, FastAPI, Node.js, Express.js, Tailwind CSS, Redux Toolkit
- Databases & Caching: PostgreSQL, Redis, MongoDB, SQLAlchemy
- Cloud & Tools: Docker, Git, GitHub Actions, AWS (S3, EC2), Linux, Nginx, Pytest, Jest

WORK EXPERIENCE
Software Engineer | Apex Cloud Solutions | 2023 - Present
- Designed and built responsive frontend dashboards using React.js, TypeScript, and Tailwind CSS serving 45,000+ monthly active users.
- Developed 25+ async RESTful API microservices in FastAPI with PostgreSQL backend, reducing average endpoint latency from 180ms to 42ms.
- Containerized development and staging environments using Docker, cutting onboarding time for new engineers by 65%.
- Implemented robust JWT authentication with role-based access control and token revocation using Redis.

Junior Full-Stack Developer | Nexus Labs | 2022 - 2023
- Built interactive client-facing features with React and Redux, improving user session duration by 28%.
- Integrated third-party payment gateways (Stripe) and automated invoice generation webhooks using Node.js and Express.
- Collaborated in an agile scrum team of 8 engineers with daily standups, code reviews, and automated CI/CD via GitHub Actions.

KEY PROJECTS
DevFlow — AI Collaborative Workspace (React, FastAPI, PostgreSQL, WebSockets)
- Architected an AI-assisted code documentation generator with real-time WebSocket sync and syntax highlighting.
- Deployed on AWS with Docker container orchestration and automated testing suite boasting 92% coverage.

CloudMetrics — Distributed Telemetry Dashboard (TypeScript, Next.js, Redis, Tailwind)
- Created live server monitoring visualizations handling 10,000+ metrics/sec with custom charting components.

EDUCATION
Bachelor of Science in Computer Science | University of California, Berkeley | 2018 - 2022
- GPA: 3.85 / 4.0 | Dean's Honors List
"""
    parsed_dict = await parse_resume(sample_text)
    clean_name = "Alex_Mercer_FullStack_Resume.pdf"
    file_path = os.path.join(settings.UPLOAD_DIR, f"sample_{uuid.uuid4().hex[:8]}_{clean_name}")
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(sample_text)

    resume_obj = Resume(
        user_id=current_user.id,
        filename=clean_name,
        file_path=file_path,
        file_type="pdf",
        file_size=len(sample_text.encode('utf-8')),
        source_type="BUILDER",
        template_name="modern",
        styling_config="{}",
        raw_text=sample_text,
        parsed_data=json.dumps(parsed_dict)
    )
    db.add(resume_obj)
    db.commit()
    db.refresh(resume_obj)

    return ResumeResponse(
        id=resume_obj.id,
        user_id=resume_obj.user_id,
        filename=resume_obj.filename,
        file_type=resume_obj.file_type,
        file_size=resume_obj.file_size,
        source_type=resume_obj.source_type,
        template_name=resume_obj.template_name,
        styling_config={},
        raw_text=resume_obj.raw_text,
        parsed_data=parsed_dict,
        is_active=resume_obj.is_active,
        created_at=resume_obj.created_at,
        updated_at=resume_obj.updated_at
    )
