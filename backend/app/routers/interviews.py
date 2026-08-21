from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import User, Analysis, InterviewQuestion
from app.schemas.analysis import InterviewQuestionItem
from app.routers.auth import get_current_user
from app.services.interview_generator import generate_interview_questions

router = APIRouter(prefix="/interview", tags=["Interview Questions"])

@router.get("/{analysis_id}", response_model=List[InterviewQuestionItem])
def get_interview_questions(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id, Analysis.user_id == current_user.id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    return [
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

@router.post("/generate/{analysis_id}", response_model=List[InterviewQuestionItem])
async def regenerate_interview_questions(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id, Analysis.user_id == current_user.id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    parsed_resume = analysis.resume.get_parsed()
    parsed_job = analysis.job.get_requirements()
    import json
    matched = json.loads(analysis.matched_skills_json)
    missing = json.loads(analysis.missing_skills_json)

    new_qs = await generate_interview_questions(parsed_resume, parsed_job, matched, missing)
    
    # Remove existing questions
    db.query(InterviewQuestion).filter(InterviewQuestion.analysis_id == analysis_id).delete()
    
    # Save new
    created_items = []
    for q in new_qs:
        iq_obj = InterviewQuestion(
            analysis_id=analysis.id,
            question=q.get("question", ""),
            category=q.get("category", "Technical"),
            difficulty=q.get("difficulty", "Medium"),
            why_asked=q.get("why_asked", ""),
            what_expected=q.get("what_expected", ""),
            preparation_tips=q.get("preparation_tips", "")
        )
        db.add(iq_obj)
        created_items.append(iq_obj)
    db.commit()

    return [
        InterviewQuestionItem(
            id=q.id,
            question=q.question,
            category=q.category,
            difficulty=q.difficulty,
            why_asked=q.why_asked,
            what_expected=q.what_expected,
            preparation_tips=q.preparation_tips
        ) for q in created_items
    ]
