from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class ChatMessageCreate(BaseModel):
    session_id: Optional[int] = None
    resume_id: Optional[int] = None
    job_id: Optional[int] = None
    analysis_id: Optional[int] = None
    message: str

class ChatMessageResponse(BaseModel):
    id: int
    session_id: int
    role: str
    message: str
    action_type: Optional[str] = None
    action_payload: Optional[Dict[str, Any]] = None
    timestamp: datetime

    class Config:
        from_attributes = True

class ChatSessionCreate(BaseModel):
    resume_id: Optional[int] = None
    job_id: Optional[int] = None
    analysis_id: Optional[int] = None
    title: Optional[str] = "NextHire AI Copilot Session"

class ChatSessionResponse(BaseModel):
    id: int
    user_id: int
    resume_id: Optional[int] = None
    job_id: Optional[int] = None
    analysis_id: Optional[int] = None
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessageResponse] = []

    class Config:
        from_attributes = True
