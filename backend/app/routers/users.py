from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import User
from app.schemas.auth import UserResponse, UserUpdate
from app.routers.auth import get_current_user
from app.core.security import verify_password, get_password_hash

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserResponse)
def get_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
def update_user_profile(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if data.name:
        current_user.name = data.name.strip()
    
    if data.email and data.email.lower().strip() != current_user.email:
        # Check uniqueness
        exists = db.query(User).filter(User.email == data.email.lower().strip()).first()
        if exists:
            raise HTTPException(status_code=400, detail="Email is already taken by another account.")
        current_user.email = data.email.lower().strip()

    if data.new_password:
        if not data.current_password or not verify_password(data.current_password, current_user.password_hash):
            raise HTTPException(status_code=400, detail="Current password is incorrect.")
        current_user.password_hash = get_password_hash(data.new_password)

    db.commit()
    db.refresh(current_user)
    return current_user
