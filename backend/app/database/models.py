import json
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from app.database.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    jobs = relationship("Job", back_populates="user", cascade="all, delete-orphan")
    analyses = relationship("Analysis", back_populates="user", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False, default="")
    file_type = Column(String(50), nullable=False, default="pdf")
    file_size = Column(Integer, nullable=False, default=0)
    source_type = Column(String(50), default="UPLOAD")  # UPLOAD or BUILDER
    template_name = Column(String(50), default="modern")  # classic, modern, minimal, ats, professional
    styling_config = Column(Text, default="{}")  # JSON styling options
    raw_text = Column(Text, nullable=False, default="")
    parsed_data = Column(Text, nullable=False, default="{}")  # JSON string
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="resumes")
    sections = relationship("ResumeSection", back_populates="resume", cascade="all, delete-orphan")
    analyses = relationship("Analysis", back_populates="resume", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="resume", cascade="all, delete-orphan")

    def get_parsed(self):
        try:
            return json.loads(self.parsed_data)
        except Exception:
            return {}

class ResumeSection(Base):
    __tablename__ = "resume_sections"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False, index=True)
    section_name = Column(String(100), nullable=False)  # summary, skills, education, experience, projects, etc.
    content = Column(Text, nullable=False)
    structured_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=utcnow)

    resume = relationship("Resume", back_populates="sections")

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=False)
    url = Column(String(512), nullable=True)
    description = Column(Text, nullable=False)
    requirements_json = Column(Text, nullable=False, default="{}")  # Extracted skills, experience, education
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="jobs")
    analyses = relationship("Analysis", back_populates="job", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="job", cascade="all, delete-orphan")

    def get_requirements(self):
        try:
            return json.loads(self.requirements_json)
        except Exception:
            return {}

class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)

    # Granular Scores (0-100)
    overall_score = Column(Float, nullable=False, default=0.0)
    ats_score = Column(Float, nullable=False, default=0.0)
    recruiter_score = Column(Float, nullable=False, default=0.0)
    skill_match_score = Column(Float, nullable=False, default=0.0)
    experience_match_score = Column(Float, nullable=False, default=0.0)
    project_match_score = Column(Float, nullable=False, default=0.0)
    education_match_score = Column(Float, nullable=False, default=0.0)
    keyword_match_score = Column(Float, nullable=False, default=0.0)

    # Detailed Structured JSON Data
    matched_skills_json = Column(Text, default="[]")
    missing_skills_json = Column(Text, default="[]")
    partial_skills_json = Column(Text, default="[]")
    extra_skills_json = Column(Text, default="[]")
    strengths_json = Column(Text, default="[]")
    weaknesses_json = Column(Text, default="[]")
    recruiter_verdict_json = Column(Text, default="{}")
    recommendations_json = Column(Text, default="[]")

    status = Column(String(50), default="completed")  # pending, processing, completed, failed
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="analyses")
    resume = relationship("Resume", back_populates="analyses")
    job = relationship("Job", back_populates="analyses")
    rejection_risks = relationship("RejectionRisk", back_populates="analysis", cascade="all, delete-orphan")
    interview_questions = relationship("InterviewQuestion", back_populates="analysis", cascade="all, delete-orphan")
    preparation_gaps = relationship("PreparationGap", back_populates="analysis", cascade="all, delete-orphan")
    improvements = relationship("ResumeImprovement", back_populates="analysis", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="analysis", cascade="all, delete-orphan")

class RejectionRisk(Base):
    __tablename__ = "rejection_risks"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False, index=True)
    risk_title = Column(String(255), nullable=False)
    risk_level = Column(String(50), nullable=False)  # High Risk, Medium Risk, Low Risk
    evidence = Column(Text, nullable=False)
    affected_requirement = Column(String(255), nullable=True)
    recommendation = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utcnow)

    analysis = relationship("Analysis", back_populates="rejection_risks")

class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False, index=True)
    question = Column(Text, nullable=False)
    category = Column(String(100), nullable=False)  # HR, Technical, Project, Resume-based, Job-specific, Behavioral, Scenario
    difficulty = Column(String(50), nullable=False)  # Easy, Medium, Hard
    why_asked = Column(Text, nullable=False)
    what_expected = Column(Text, nullable=False)
    preparation_tips = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utcnow)

    analysis = relationship("Analysis", back_populates="interview_questions")

class PreparationGap(Base):
    __tablename__ = "preparation_gaps"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False, index=True)
    strong_areas_json = Column(Text, default="[]")
    weak_areas_json = Column(Text, default="[]")
    missing_knowledge_json = Column(Text, default="[]")
    preparation_plan_json = Column(Text, default="[]")  # Day 1..Day 7 structured roadmap
    created_at = Column(DateTime, default=utcnow)

    analysis = relationship("Analysis", back_populates="preparation_gaps")

class ResumeImprovement(Base):
    __tablename__ = "resume_improvements"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False, index=True)
    section_name = Column(String(100), nullable=False)
    original_text = Column(Text, nullable=False)
    suggested_text = Column(Text, nullable=False)
    reason_for_change = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utcnow)

    analysis = relationship("Analysis", back_populates="improvements")

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="SET NULL"), nullable=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(255), default="Career Copilot Chat")
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="chat_sessions")
    resume = relationship("Resume", back_populates="chat_sessions")
    job = relationship("Job", back_populates="chat_sessions")
    analysis = relationship("Analysis", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan", order_by="ChatMessage.timestamp.asc()")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), nullable=False)  # user, assistant, system
    message = Column(Text, nullable=False)
    action_type = Column(String(100), nullable=True)  # analyze, interview, missing_skills, rejection_risks, prep_plan, rewrite
    action_payload_json = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=utcnow)

    session = relationship("ChatSession", back_populates="messages")
