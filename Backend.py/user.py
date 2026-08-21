from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr
from typing import Literal
from db import get_db

router = APIRouter()

# TODO: Jab Shreya schemas.py mein UserCreate finalize kare,
# is local class ko hata ke "from schemas import UserCreate" import kar lena
class UserCreate(BaseModel):
    email: EmailStr
    username: str
    role: Literal["citizen", "authority"]


@router.post("/users")
async def create_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    query = text("""
        insert into users (email, username, role)
        values (:email, :username, :role)
        returning id, email, username, role, created_at
    """)
    try:
        result = await db.execute(query, {
            "email": user.email,
            "username": user.username,
            "role": user.role
        })
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Email already exists")

    row = result.mappings().first()
    return {"user": dict(row)}