from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import get_password_hash, verify_password
from datetime import datetime


def create_user(db: Session, user_data: UserCreate) -> User:
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken")
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        display_name=user_data.display_name or user_data.username,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, username: str, password: str) -> User | None:
    user = db.query(User).filter(User.username == username).first()
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def get_users(db: Session, search: str | None = None, exclude_id: int | None = None) -> list[User]:
    query = db.query(User)
    if exclude_id:
        query = query.filter(User.id != exclude_id)
    if search:
        query = query.filter(
            (User.username.ilike(f"%{search}%")) | (User.display_name.ilike(f"%{search}%"))
        )
    return query.limit(50).all()


def set_user_online(db: Session, user_id: int, online: bool):
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.is_online = online
        if not online:
            user.last_seen = datetime.utcnow()
        db.commit()
