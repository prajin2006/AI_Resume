import json
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import (
    User, Resume, Job, Analysis, RejectionRisk,
    InterviewQuestion, PreparationGap, ResumeImprovement
)
from app.schemas.analysis import (
    AnalysisResponse, AnalysisSummaryItem,
    RejectionRiskItem, InterviewQuestionItem,
    PreparationGapData, ResumeImprovementItem,
    ResumeComparisonResponse, ComprehensiveComparisonResponse,
    ComparisonVersionData, ComparisonImprovements
)
from app.routers.auth import get_current_user
from app.services.matcher import compare_skills, calculate_match_scores, calculate_ats_breakdown
from app.services.recruiter import generate_recruiter_review
from app.services.rejection_predictor import generate_rejection_risks
from app.services.interview_generator import generate_interview_questions
from app.services.preparation import generate_preparation_analysis
from app.services.resume_improver import generate_resume_improvements

router = APIRouter(prefix="/analysis", tags=["Resume Analysis"])

def format_analysis_response(analysis: Analysis) -> AnalysisResponse:
    recruiter_v = {}
    try: recruiter_v = json.loads(analysis.recruiter_verdict_json)
    except Exception: pass

    matched = []
    try: matched = json.loads(analysis.matched_skills_json)
    except Exception: pass

    missing = []
    try: missing = json.loads(analysis.missing_skills_json)
    except Exception: pass

    partial = []
    try: partial = json.loads(analysis.partial_skills_json)
    except Exception: pass

    extra = []
    try: extra = json.loads(analysis.extra_skills_json)
    except Exception: pass

    strengths = []
    try: strengths = json.loads(analysis.strengths_json)
    except Exception: pass

    weaknesses = []
    try: weaknesses = json.loads(analysis.weaknesses_json)
    except Exception: pass

    recomms = []
    try: recomms = json.loads(analysis.recommendations_json)
    except Exception: pass

    # Dynamic ATS Breakdown
    resume_parsed = analysis.resume.get_parsed() if analysis.resume else {}
    job_reqs = analysis.job.get_requirements() if analysis.job else {}
    raw_text = analysis.resume.raw_text if analysis.resume else ""
    ats_breakdown_data = calculate_ats_breakdown(raw_text, resume_parsed, job_reqs, matched, missing)

    # Risks
    risks = [
        RejectionRiskItem(
            id=r.id,
            risk_title=r.risk_title,
            risk_level=r.risk_level,
            evidence=r.evidence,
            affected_requirement=r.affected_requirement,
            recommendation=r.recommendation
        ) for r in analysis.rejection_risks
    ]

    # Questions
    questions = [
        InterviewQuestionItem(
            id=q.id,
            question=q.question,
            category=q.category,
            difficulty=q.difficulty,
            why_asked=q.why_asked,
            what_expected=q.what_expected,
            preparation_tips=q.preparation_tips
        ) for q in analysis.interview_questions
    ]

    # Prep Gaps
    prep_data = None
    if analysis.preparation_gaps:
        pg = analysis.preparation_gaps[0]
        try:
            prep_data = PreparationGapData(
                strong_areas=json.loads(pg.strong_areas_json),
                weak_areas=json.loads(pg.weak_areas_json),
                missing_knowledge=json.loads(pg.missing_knowledge_json),
                preparation_plan=json.loads(pg.preparation_plan_json)
            )
        except Exception:
            pass

    # Improvements
    improvements = [
        ResumeImprovementItem(
            id=imp.id,
            section_name=imp.section_name,
            original_text=imp.original_text,
            suggested_text=imp.suggested_text,
            reason_for_change=imp.reason_for_change
        ) for imp in analysis.improvements
    ]

    return AnalysisResponse(
        id=analysis.id,
        user_id=analysis.user_id,
        resume_id=analysis.resume_id,
        job_id=analysis.job_id,
        resume_filename=analysis.resume.filename if analysis.resume else "Resume",
        job_title=analysis.job.title if analysis.job else "Target Role",
        job_company=analysis.job.company if analysis.job else "Target Company",
        overall_score=analysis.overall_score,
        ats_score=analysis.ats_score,
        recruiter_score=analysis.recruiter_score,
        skill_match_score=analysis.skill_match_score,
        experience_match_score=analysis.experience_match_score,
        project_match_score=analysis.project_match_score,
        education_match_score=analysis.education_match_score,
        keyword_match_score=analysis.keyword_match_score,
        ats_breakdown=ats_breakdown_data,
        matched_skills=matched,
        missing_skills=missing,
        partial_skills=partial,
        extra_skills=extra,
        strengths=strengths,
        weaknesses=weaknesses,
        recruiter_verdict=recruiter_v,
        recommendations=recomms,
        rejection_risks=risks,
        interview_questions=questions,
        preparation_gaps=prep_data,
        improvements=improvements,
        status=analysis.status,
        created_at=analysis.created_at
    )

@router.post("/{resume_id}/{job_id}", response_model=AnalysisResponse)
async def run_full_analysis(
    resume_id: int,
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Run end-to-end multi-dimensional match, screening, risks, and interview coaching."""
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    job = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job description not found")

    parsed_resume = resume.get_parsed()
    parsed_job = job.get_requirements()
    raw_resume_text = resume.raw_text

    # 1. Compare Skills
    matched_skills, missing_skills, partial_skills, extra_skills = compare_skills(
        parsed_resume.get("skills", []),
        parsed_job.get("required_skills", []) + parsed_job.get("preferred_skills", [])
    )

    # 2. Granular Multi-Score Matrix & ATS Breakdown
    match_scores = calculate_match_scores(
        parsed_resume,
        parsed_job,
        matched_skills,
        missing_skills,
        partial_skills,
        raw_resume_text
    )

    # 3. AI Recruiter Simulation
    recruiter_review = await generate_recruiter_review(
        parsed_resume,
        parsed_job,
        match_scores,
        matched_skills,
        missing_skills
    )

    # 4. Evidence-Based Rejection Risk Predictions
    rejection_risks_data = await generate_rejection_risks(
        parsed_resume,
        parsed_job,
        missing_skills,
        raw_resume_text
    )

    # 5. Tailored Interview Preparation Questions
    interview_questions_data = await generate_interview_questions(
        parsed_resume,
        parsed_job,
        matched_skills,
        missing_skills
    )

    # 6. 5-Day Interview Preparation Roadmap
    prep_analysis_data = await generate_preparation_analysis(
        parsed_resume,
        parsed_job,
        missing_skills,
        matched_skills
    )

    # 7. Fact-Preserving Resume Bullet Improvements
    improvements_data = await generate_resume_improvements(
        parsed_resume,
        parsed_job
    )

    # Persist Analysis Record
    analysis = Analysis(
        user_id=current_user.id,
        resume_id=resume.id,
        job_id=job.id,
        overall_score=match_scores["overall_score"],
        ats_score=match_scores["ats_score"],
        recruiter_score=match_scores["recruiter_score"],
        skill_match_score=match_scores["skill_match_score"],
        experience_match_score=match_scores["experience_match_score"],
        project_match_score=match_scores["project_match_score"],
        education_match_score=match_scores["education_match_score"],
        keyword_match_score=match_scores["keyword_match_score"],
        matched_skills_json=json.dumps(matched_skills),
        missing_skills_json=json.dumps(missing_skills),
        partial_skills_json=json.dumps(partial_skills),
        extra_skills_json=json.dumps(extra_skills),
        strengths_json=json.dumps(recruiter_review.get("strengths", [])),
        weaknesses_json=json.dumps(recruiter_review.get("concerns", [])),
        recruiter_verdict_json=json.dumps(recruiter_review),
        recommendations_json=json.dumps(recruiter_review.get("recommended_improvements", [])),
        status="completed"
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    # Add Rejection Risks
    for r in rejection_risks_data:
        risk_obj = RejectionRisk(
            analysis_id=analysis.id,
            risk_title=r.get("risk_title", "Possible Recruiter Concern"),
            risk_level=r.get("risk_level", "Medium Risk"),
            evidence=r.get("evidence", ""),
            affected_requirement=r.get("affected_requirement", ""),
            recommendation=r.get("recommendation", "")
        )
        db.add(risk_obj)

    # Add Interview Questions
    for q in interview_questions_data:
        q_obj = InterviewQuestion(
            analysis_id=analysis.id,
            question=q.get("question", ""),
            category=q.get("category", "Technical"),
            difficulty=q.get("difficulty", "Medium"),
            why_asked=q.get("why_asked", ""),
            what_expected=q.get("what_expected", ""),
            preparation_tips=q.get("preparation_tips", "")
        )
        db.add(q_obj)

    # Add Preparation Gap
    pg_obj = PreparationGap(
        analysis_id=analysis.id,
        strong_areas_json=json.dumps(prep_analysis_data.get("strong_areas", [])),
        weak_areas_json=json.dumps(prep_analysis_data.get("weak_areas", [])),
        missing_knowledge_json=json.dumps(prep_analysis_data.get("missing_knowledge", [])),
        preparation_plan_json=json.dumps(prep_analysis_data.get("preparation_plan", []))
    )
    db.add(pg_obj)

    # Add Resume Improvements
    for imp in improvements_data:
        imp_obj = ResumeImprovement(
            analysis_id=analysis.id,
            section_name=imp.get("section_name", "General"),
            original_text=imp.get("original_text", ""),
            suggested_text=imp.get("suggested_text", ""),
            reason_for_change=imp.get("reason_for_change", "")
        )
        db.add(imp_obj)

    db.commit()
    db.refresh(analysis)

    return format_analysis_response(analysis)

@router.get("", response_model=List[AnalysisSummaryItem])
def get_analysis_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List completed analyses belonging to current user."""
    analyses = db.query(Analysis).filter(Analysis.user_id == current_user.id).order_by(Analysis.created_at.desc()).all()
    results = []
    for a in analyses:
        results.append(AnalysisSummaryItem(
            id=a.id,
            resume_id=a.resume_id,
            job_id=a.job_id,
            resume_filename=a.resume.filename if a.resume else "Resume",
            job_title=a.job.title if a.job else "Target Role",
            job_company=a.job.company if a.job else "Company",
            overall_score=a.overall_score,
            ats_score=a.ats_score,
            skill_match_score=a.skill_match_score,
            recruiter_score=a.recruiter_score,
            status=a.status,
            created_at=a.created_at
        ))
    return results

@router.get("/compare/query", response_model=ComprehensiveComparisonResponse)
def compare_analyses_query(
    analysis_a: int = Query(..., description="ID of baseline analysis A"),
    analysis_b: int = Query(..., description="ID of revised analysis B"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Compare two analyses via query params: /api/analysis/compare/query?analysis_a=X&analysis_b=Y"""
    return perform_comprehensive_comparison(analysis_a, analysis_b, current_user, db)

@router.get("/compare/{id1}/{id2}", response_model=ComprehensiveComparisonResponse)
def compare_analyses_path(
    id1: int,
    id2: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Compare two analyses via path params: /api/analysis/compare/{id1}/{id2}"""
    return perform_comprehensive_comparison(id1, id2, current_user, db)

def perform_comprehensive_comparison(
    id1: int,
    id2: int,
    current_user: User,
    db: Session
) -> ComprehensiveComparisonResponse:
    """Core logic to compare two analyses with strict authorization and delta calculation."""
    if id1 == id2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Version A and Version B must be different analysis records."
        )

    a1 = db.query(Analysis).filter(Analysis.id == id1).first()
    a2 = db.query(Analysis).filter(Analysis.id == id2).first()

    if not a1 or not a2:
        raise HTTPException(status_code=404, detail="One or both selected analyses could not be found.")

    if a1.user_id != current_user.id or a2.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied. You can only compare your own analyses.")

    resp1 = format_analysis_response(a1)
    resp2 = format_analysis_response(a2)

    # Score improvements
    overall_diff = round(resp2.overall_score - resp1.overall_score, 1)
    ats_diff = round(resp2.ats_score - resp1.ats_score, 1)
    job_match_diff = round(resp2.skill_match_score - resp1.skill_match_score, 1)
    recruiter_diff = round(resp2.recruiter_score - resp1.recruiter_score, 1)

    # Skill comparison
    skills_a = resp1.matched_skills + resp1.extra_skills
    skills_b = resp2.matched_skills + resp2.extra_skills

    skills_added = [s for s in skills_b if s.lower() not in [x.lower() for x in skills_a]]
    skills_removed = [s for s in skills_a if s.lower() not in [x.lower() for x in skills_b]]
    skills_retained = [s for s in skills_b if s.lower() in [x.lower() for x in skills_a]]

    newly_matched_skills = [s for s in resp2.matched_skills if s.lower() not in [x.lower() for x in resp1.matched_skills]]
    still_missing_skills = resp2.missing_skills

    # Strengths / Weaknesses comparison
    strengths_improved = [s for s in resp2.strengths if s not in resp1.strengths]
    weaknesses_resolved = [w for w in resp1.weaknesses if w not in resp2.weaknesses]

    # Rejection risks comparison
    risks_a_titles = [r.risk_title for r in resp1.rejection_risks]
    risks_b_titles = [r.risk_title for r in resp2.rejection_risks]
    risks_reduced = [r for r in risks_a_titles if r not in risks_b_titles]
    risks_added = [r for r in risks_b_titles if r not in risks_a_titles]

    if overall_diff > 0:
        verdict = f"Version B shows an improvement of +{overall_diff} points overall, with an ATS score increase of +{ats_diff} points and {len(newly_matched_skills)} newly matched job skills."
    elif overall_diff < 0:
        verdict = f"Version A performed higher overall (+{abs(overall_diff)} pts). Check if critical technical keywords or experience details were removed in Version B."
    else:
        verdict = "Both versions have equal overall scores. Review the individual skill additions and recruiter notes below for fine-grained improvements."

    version_a_data = ComparisonVersionData(
        analysis_id=a1.id,
        resume_id=a1.resume_id,
        resume_name=a1.resume.filename if a1.resume else "Resume V1",
        job_title=a1.job.title if a1.job else "Target Role",
        job_company=a1.job.company if a1.job else "Target Company",
        analysis_date=a1.created_at,
        overall_score=a1.overall_score,
        ats_score=a1.ats_score,
        job_match_score=a1.skill_match_score,
        recruiter_score=a1.recruiter_score,
        skill_coverage=a1.skill_match_score,
        skills=skills_a,
        matched_skills=resp1.matched_skills,
        missing_skills=resp1.missing_skills,
        strengths=resp1.strengths,
        weaknesses=resp1.weaknesses,
        rejection_risks=[{"title": r.risk_title, "level": r.risk_level, "evidence": r.evidence} for r in resp1.rejection_risks]
    )

    version_b_data = ComparisonVersionData(
        analysis_id=a2.id,
        resume_id=a2.resume_id,
        resume_name=a2.resume.filename if a2.resume else "Resume V2",
        job_title=a2.job.title if a2.job else "Target Role",
        job_company=a2.job.company if a2.job else "Target Company",
        analysis_date=a2.created_at,
        overall_score=a2.overall_score,
        ats_score=a2.ats_score,
        job_match_score=a2.skill_match_score,
        recruiter_score=a2.recruiter_score,
        skill_coverage=a2.skill_match_score,
        skills=skills_b,
        matched_skills=resp2.matched_skills,
        missing_skills=resp2.missing_skills,
        strengths=resp2.strengths,
        weaknesses=resp2.weaknesses,
        rejection_risks=[{"title": r.risk_title, "level": r.risk_level, "evidence": r.evidence} for r in resp2.rejection_risks]
    )

    improvements_data = ComparisonImprovements(
        overall_score_change=overall_diff,
        ats_score_change=ats_diff,
        job_match_change=job_match_diff,
        recruiter_score_change=recruiter_diff,
        skills_added=skills_added,
        skills_removed=skills_removed,
        skills_retained=skills_retained,
        newly_matched_skills=newly_matched_skills,
        still_missing_skills=still_missing_skills,
        strengths_improved=strengths_improved,
        weaknesses_resolved=weaknesses_resolved,
        risks_reduced=risks_reduced,
        risks_added=risks_added,
        verdict=verdict
    )

    return ComprehensiveComparisonResponse(
        version_a=version_a_data,
        version_b=version_b_data,
        improvements=improvements_data
    )

@router.get("/{analysis_id}", response_model=AnalysisResponse)
def get_analysis_by_id(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id, Analysis.user_id == current_user.id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis record not found")
    return format_analysis_response(analysis)

@router.delete("/{analysis_id}")
def delete_analysis(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id, Analysis.user_id == current_user.id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    db.delete(analysis)
    db.commit()
    return {"message": "Analysis deleted successfully", "id": analysis_id}
