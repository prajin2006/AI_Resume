from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class ContactInfo(BaseModel):
    name: Optional[str] = ""
    title: Optional[str] = ""
    email: Optional[str] = ""
    phone: Optional[str] = ""
    location: Optional[str] = ""
    linkedin: Optional[str] = ""
    github: Optional[str] = ""
    portfolio: Optional[str] = ""

class ExperienceItem(BaseModel):
    id: Optional[str] = None
    title: str = ""
    company: str = ""
    location: Optional[str] = ""
    start_date: Optional[str] = ""
    end_date: Optional[str] = ""
    currently_working: Optional[bool] = False
    description: List[str] = []

class EducationItem(BaseModel):
    id: Optional[str] = None
    institution: str = ""
    degree: str = ""
    field: Optional[str] = ""
    location: Optional[str] = ""
    start_date: Optional[str] = ""
    end_date: Optional[str] = ""
    graduation_year: Optional[str] = ""
    gpa: Optional[str] = ""
    coursework: Optional[str] = ""
    description: Optional[str] = ""

class ProjectItem(BaseModel):
    id: Optional[str] = None
    name: str = ""
    technologies: List[str] = []
    description: List[str] = []
    github_url: Optional[str] = ""
    live_url: Optional[str] = ""
    start_date: Optional[str] = ""
    end_date: Optional[str] = ""
    link: Optional[str] = ""

class CertificationItem(BaseModel):
    id: Optional[str] = None
    name: str = ""
    organization: Optional[str] = ""
    issue_date: Optional[str] = ""
    expiry_date: Optional[str] = ""
    credential_id: Optional[str] = ""
    credential_url: Optional[str] = ""

class AchievementItem(BaseModel):
    id: Optional[str] = None
    title: str = ""
    description: Optional[str] = ""
    date: Optional[str] = ""

class AdditionalSection(BaseModel):
    id: Optional[str] = None
    section_name: str = ""
    items: List[str] = []
    enabled: bool = True

class ParsedResumeData(BaseModel):
    contact: ContactInfo = ContactInfo()
    summary: str = ""
    skills: List[str] = []
    technical_skills: List[str] = []
    soft_skills: List[str] = []
    tools_technologies: List[str] = []
    experience: List[ExperienceItem] = []
    education: List[EducationItem] = []
    projects: List[ProjectItem] = []
    certifications: List[Any] = []
    achievements: List[Any] = []
    languages: List[str] = []
    additional_sections: List[AdditionalSection] = []
    total_years_experience: float = 0.0

class ResumeCreate(BaseModel):
    filename: str = "Untitled_Resume"
    template_name: str = "modern"
    styling_config: Optional[Dict[str, Any]] = {}
    data: ParsedResumeData

class ResumeUpdate(BaseModel):
    filename: Optional[str] = None
    template_name: Optional[str] = None
    styling_config: Optional[Dict[str, Any]] = None
    data: Optional[ParsedResumeData] = None

class ResumeResponse(BaseModel):
    id: int
    user_id: int
    filename: str
    file_type: str
    file_size: int
    source_type: str = "UPLOAD"  # UPLOAD or BUILDER
    template_name: str = "modern"
    styling_config: Dict[str, Any] = {}
    raw_text: str
    parsed_data: Dict[str, Any]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ResumeListResponse(BaseModel):
    id: int
    filename: str
    file_type: str
    file_size: int
    source_type: str = "UPLOAD"
    template_name: str = "modern"
    created_at: datetime
    updated_at: datetime
    candidate_name: Optional[str] = ""
    candidate_title: Optional[str] = ""
    skills_count: int = 0
    experience_years: float = 0.0
    latest_overall_score: Optional[float] = None
    latest_ats_score: Optional[float] = None
    latest_job_title: Optional[str] = None

    class Config:
        from_attributes = True

class AIAssistRequest(BaseModel):
    action: str  # "generate_summary", "improve_summary", "improve_bullet", "suggest_skills", "make_ats_friendly", "make_concise"
    context: Optional[Dict[str, Any]] = {}
    text: Optional[str] = ""

class AIAssistResponse(BaseModel):
    result: str
    suggestions: Optional[List[str]] = []
