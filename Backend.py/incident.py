from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from db import get_db

router = APIRouter()