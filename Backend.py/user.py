from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from db import get_db
from schema import UserCreate

router = APIRouter()

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