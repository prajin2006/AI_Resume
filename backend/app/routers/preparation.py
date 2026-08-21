import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import User, Analysis, PreparationGap
from app.schemas.analysis import PreparationGapData
from app.routers.auth import get_current_user
from app.services.preparation import generate_preparation_analysis

router = APIRouter(prefix="/preparation", tags=["Preparation Gap Analyzer"])

@router.get("/{analysis_id}", response_model=PreparationGapData)
def get_preparation_data(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id, Analysis.user_id == current_user.id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    if not analysis.preparation_gaps:
        raise HTTPException(status_code=404, detail="No preparation data found for this analysis")
    
    pg = analysis.preparation_gaps[0]
    return PreparationGapData(
        strong_areas=json.loads(pg.strong_areas_json),
        weak_areas=json.loads(pg.weak_areas_json),
        missing_knowledge=json.loads(pg.missing_knowledge_json),
        preparation_plan=json.loads(pg.preparation_plan_json)
    )

@router.post("/toggle/{analysis_id}/{day_num}")
def toggle_day_task(
    analysis_id: int,
    day_num: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id, Analysis.user_id == current_user.id).first()
    if not analysis or not analysis.preparation_gaps:
        raise HTTPException(status_code=404, detail="Preparation record not found")

    pg = analysis.preparation_gaps[0]
    plan = json.loads(pg.preparation_plan_json)
    for day in plan:
        if day.get("day") == day_num:
            day["completed"] = not day.get("completed", False)
            break

    pg.preparation_plan_json = json.dumps(plan)
    db.commit()
    return {"message": "Updated task status", "preparation_plan": plan}
