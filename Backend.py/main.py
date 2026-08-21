from fastapi import FastAPI, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from db import get_db

app = FastAPI()

@app.get("/health")
async def health(db: AsyncSession = Depends(get_db)):
    r = await db.execute(text("select postgis_version()"))
    return {"postgis": r.scalar()}