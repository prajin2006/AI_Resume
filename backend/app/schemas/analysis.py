from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class RejectionRiskItem(BaseModel):
    id: Optional[int] = None
    risk_title: str
    risk_level: str  # "High Risk", "Medium Risk", "Low Risk"
    evidence: str
    affected_requirement: Optional[str] = ""
    recommendation: str

class InterviewQuestionItem(BaseModel):
    id: Optional[int] = None
    question: str
    category: str
    difficulty: str
    why_asked: str
    what_expected: str
    preparation_tips: str

class PreparationPlanDay(BaseModel):
    day: int
    title: str
    topics: List[str]
    tasks: List[str]
    completed: bool = False

class PreparationGapData(BaseModel):
    strong_areas: List[str] = []
    weak_areas: List[str] = []
    missing_knowledge: List[str] = []
    preparation_plan: List[Dict[str, Any]] = []

class ResumeImprovementItem(BaseModel):
    id: Optional[int] = None
    section_name: str
    original_text: str
    suggested_text: str
    reason_for_change: str

class RecruiterVerdict(BaseModel):
    verdict: str  # "Strong Fit", "Potential Fit with Gaps", "High Risk / Significant Gaps"
    summary: str
    strengths: List[str] = []
    concerns: List[str] = []
    missing_qualifications: List[str] = []
    recommended_improvements: List[str] = []

class AnalysisCreateRequest(BaseModel):
    resume_id: int
    job_id: int

class AnalysisResponse(BaseModel):
    id: int
    user_id: int
    resume_id: int
    job_id: int
    resume_filename: Optional[str] = ""
    job_title: Optional[str] = ""
    job_company: Optional[str] = ""
    
    # Granular Scores
    overall_score: float
    ats_score: float
    recruiter_score: float
    skill_match_score: float
    experience_match_score: float
    project_match_score: float
    education_match_score: float
    keyword_match_score: float

    # ATS Specific Breakdown & Status
    ats_breakdown: Optional[Dict[str, Any]] = None

    # Skills Breakdown
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    partial_skills: List[str] = []
    extra_skills: List[str] = []

    strengths: List[str] = []
    weaknesses: List[str] = []
    recruiter_verdict: Dict[str, Any] = {}
    recommendations: List[str] = []
    
    rejection_risks: List[RejectionRiskItem] = []
    interview_questions: List[InterviewQuestionItem] = []
    preparation_gaps: Optional[PreparationGapData] = None
    improvements: List[ResumeImprovementItem] = []

    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class AnalysisSummaryItem(BaseModel):
    id: int
    resume_id: int
    job_id: int
    resume_filename: str
    job_title: str
    job_company: str
    overall_score: float
    ats_score: float
    skill_match_score: float
    recruiter_score: Optional[float] = 0.0
    status: str
    created_at: datetime

class ComparisonVersionData(BaseModel):
    analysis_id: int
    resume_id: int
    resume_name: str
    job_title: str
    job_company: str
    analysis_date: datetime
    overall_score: float
    ats_score: float
    job_match_score: float
    recruiter_score: float
    skill_coverage: float
    skills: List[str] = []
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    strengths: List[str] = []
    weaknesses: List[str] = []
    rejection_risks: List[Dict[str, Any]] = []

class ComparisonImprovements(BaseModel):
    overall_score_change: float
    ats_score_change: float
    job_match_change: float
    recruiter_score_change: float
    skills_added: List[str] = []
    skills_removed: List[str] = []
    skills_retained: List[str] = []
    newly_matched_skills: List[str] = []
    still_missing_skills: List[str] = []
    strengths_improved: List[str] = []
    weaknesses_resolved: List[str] = []
    risks_reduced: List[str] = []
    risks_added: List[str] = []
    verdict: str

class ComprehensiveComparisonResponse(BaseModel):
    version_a: ComparisonVersionData
    version_b: ComparisonVersionData
    improvements: ComparisonImprovements

ResumeComparisonResponse = ComprehensiveComparisonResponse
