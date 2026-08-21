from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import User, Analysis, ResumeImprovement
from app.schemas.analysis import ResumeImprovementItem
from app.routers.auth import get_current_user
from app.services.resume_improver import generate_resume_improvements

router = APIRouter(prefix="/improvements", tags=["Resume Improvements"])

@router.get("/{analysis_id}", response_model=List[ResumeImprovementItem])
def get_improvements(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id, Analysis.user_id == current_user.id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    return [
        ResumeImprovementItem(
            id=i.id,
            section_name=i.section_name,
            original_text=i.original_text,
            suggested_text=i.suggested_text,
            reason_for_change=i.reason_for_change
        ) for i in analysis.improvements
    ]

@router.post("/generate/{analysis_id}", response_model=List[ResumeImprovementItem])
async def regenerate_improvements(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id, Analysis.user_id == current_user.id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    new_imps = await generate_resume_improvements(analysis.resume.get_parsed(), analysis.job.get_requirements())
    
    db.query(ResumeImprovement).filter(ResumeImprovement.analysis_id == analysis_id).delete()

    created_items = []
    for item in new_imps:
        imp_obj = ResumeImprovement(
            analysis_id=analysis.id,
            section_name=item.get("section_name", "General"),
            original_text=item.get("original_text", ""),
            suggested_text=item.get("suggested_text", ""),
            reason_for_change=item.get("reason_for_change", "")
        )
        db.add(imp_obj)
        created_items.append(imp_obj)
    db.commit()

    return [
        ResumeImprovementItem(
            id=i.id,
            section_name=i.section_name,
            original_text=i.original_text,
            suggested_text=i.suggested_text,
            reason_for_change=i.reason_for_change
        ) for i in created_items
    ]
