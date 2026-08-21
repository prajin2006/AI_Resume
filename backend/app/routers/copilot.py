import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import User, Resume, Job, Analysis, ChatSession, ChatMessage
from app.schemas.copilot import (
    ChatMessageCreate, ChatMessageResponse,
    ChatSessionCreate, ChatSessionResponse
)
from app.routers.auth import get_current_user
from app.services.copilot import generate_copilot_response

router = APIRouter(prefix="/copilot", tags=["AI Copilot"])

def format_message(msg: ChatMessage) -> ChatMessageResponse:
    payload = None
    if msg.action_payload_json:
        try:
            payload = json.loads(msg.action_payload_json)
        except Exception:
            pass
    return ChatMessageResponse(
        id=msg.id,
        session_id=msg.session_id,
        role=msg.role,
        message=msg.message,
        action_type=msg.action_type,
        action_payload=payload,
        timestamp=msg.timestamp
    )

@router.post("/session", response_model=ChatSessionResponse)
def create_session(
    data: ChatSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = ChatSession(
        user_id=current_user.id,
        resume_id=data.resume_id,
        job_id=data.job_id,
        analysis_id=data.analysis_id,
        title=data.title or "Career Copilot Session"
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Add initial greeting message
    greeting = ChatMessage(
        session_id=session.id,
        role="assistant",
        message="Hello! I'm your **NextHire AI Copilot**. I have access to your resume, job description, and match metrics. Ask me how to improve your ATS score, practice interview questions, or prepare for recruiter screenings!"
    )
    db.add(greeting)
    db.commit()
    db.refresh(session)

    return ChatSessionResponse(
        id=session.id,
        user_id=session.user_id,
        resume_id=session.resume_id,
        job_id=session.job_id,
        analysis_id=session.analysis_id,
        title=session.title,
        created_at=session.created_at,
        updated_at=session.updated_at,
        messages=[format_message(m) for m in session.messages]
    )

@router.get("/sessions", response_model=List[ChatSessionResponse])
def get_user_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions = db.query(ChatSession).filter(ChatSession.user_id == current_user.id).order_by(ChatSession.updated_at.desc()).all()
    results = []
    for s in sessions:
        results.append(ChatSessionResponse(
            id=s.id,
            user_id=s.user_id,
            resume_id=s.resume_id,
            job_id=s.job_id,
            analysis_id=s.analysis_id,
            title=s.title,
            created_at=s.created_at,
            updated_at=s.updated_at,
            messages=[format_message(m) for m in s.messages]
        ))
    return results

@router.get("/history/{session_id}", response_model=ChatSessionResponse)
def get_session_history(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    return ChatSessionResponse(
        id=session.id,
        user_id=session.user_id,
        resume_id=session.resume_id,
        job_id=session.job_id,
        analysis_id=session.analysis_id,
        title=session.title,
        created_at=session.created_at,
        updated_at=session.updated_at,
        messages=[format_message(m) for m in session.messages]
    )

@router.post("/chat", response_model=ChatMessageResponse)
async def chat_with_copilot(
    data: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not data.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Resolve or create session
    session = None
    if data.session_id:
        session = db.query(ChatSession).filter(ChatSession.id == data.session_id, ChatSession.user_id == current_user.id).first()
    
    if not session:
        session = ChatSession(
            user_id=current_user.id,
            resume_id=data.resume_id,
            job_id=data.job_id,
            analysis_id=data.analysis_id,
            title=f"Chat: {data.message[:30]}..."
        )
        db.add(session)
        db.commit()
        db.refresh(session)

    # Save user message
    user_msg = ChatMessage(
        session_id=session.id,
        role="user",
        message=data.message.strip()
    )
    db.add(user_msg)
    db.commit()

    # Load context
    resume_data = None
    if session.resume_id:
        r = db.query(Resume).filter(Resume.id == session.resume_id).first()
        if r: resume_data = r.get_parsed()
    elif data.resume_id:
        r = db.query(Resume).filter(Resume.id == data.resume_id).first()
        if r: resume_data = r.get_parsed()

    job_data = None
    if session.job_id:
        j = db.query(Job).filter(Job.id == session.job_id).first()
        if j: job_data = {"title": j.title, "company": j.company, "requirements": j.get_requirements()}
    elif data.job_id:
        j = db.query(Job).filter(Job.id == data.job_id).first()
        if j: job_data = {"title": j.title, "company": j.company, "requirements": j.get_requirements()}

    analysis_data = None
    if session.analysis_id:
        a = db.query(Analysis).filter(Analysis.id == session.analysis_id).first()
        if a:
            try:
                analysis_data = {
                    "overall_score": a.overall_score,
                    "ats_score": a.ats_score,
                    "skill_match_score": a.skill_match_score,
                    "matched_skills": json.loads(a.matched_skills_json),
                    "missing_skills": json.loads(a.missing_skills_json),
                    "rejection_risks": [
                        {"risk_title": rr.risk_title, "risk_level": rr.risk_level, "evidence": rr.evidence}
                        for rr in a.rejection_risks
                    ]
                }
            except Exception:
                pass

    # Gather past messages for history
    past_messages = db.query(ChatMessage).filter(ChatMessage.session_id == session.id).order_by(ChatMessage.timestamp.asc()).all()
    history_list = [{"role": m.role, "message": m.message} for m in past_messages]

    # Generate response
    copilot_out = await generate_copilot_response(
        user_message=data.message,
        conversation_history=history_list,
        resume_data=resume_data,
        job_data=job_data,
        analysis_data=analysis_data
    )

    # Save assistant message
    asst_msg = ChatMessage(
        session_id=session.id,
        role="assistant",
        message=copilot_out["message"],
        action_type=copilot_out.get("action_type"),
        action_payload_json=json.dumps(copilot_out.get("action_payload")) if copilot_out.get("action_payload") else None
    )
    db.add(asst_msg)
    db.commit()
    db.refresh(asst_msg)

    return format_message(asst_msg)

@router.delete("/session/{session_id}")
def delete_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    db.delete(session)
    db.commit()
    return {"message": "Chat session deleted", "id": session_id}
