from fastapi import FastAPI, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from db import get_db
from user import router as user_router

import reports
import user
import incident

app = FastAPI()
app.include_router(user_router, tags=["users"])

app.include_router(reports.router)
app.include_router(user.router)
app.include_router(incident.router)

@app.get("/health")
async def health(db: AsyncSession = Depends(get_db)):
    r = await db.execute(text("select postgis_version()"))
    return {"postgis": r.scalar()}