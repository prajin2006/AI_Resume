from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class JobCreate(BaseModel):
    title: str
    company: str
    url: Optional[str] = ""
    description: str

class ParsedJobRequirements(BaseModel):
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    technologies: List[str] = []
    experience_years_required: float = 0.0
    education_level: Optional[str] = ""
    responsibilities: List[str] = []
    certifications: List[str] = []
    keywords: List[str] = []

class JobResponse(BaseModel):
    id: int
    user_id: int
    title: str
    company: str
    url: Optional[str] = ""
    description: str
    requirements: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True
