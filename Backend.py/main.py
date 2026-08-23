from fastapi import FastAPI, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from db import get_db
from user import router as user_router
from fastapi.middleware.cors import CORSMiddleware
import camera_monitor

import reports
import user
import incident
import storage
import classify

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173",
        "http://127.0.0.1:5173",],        # hackathon ke liye sab allow
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_router, tags=["users"])

app.include_router(reports.router)
app.include_router(user.router)
app.include_router(incident.router)
app.include_router(storage.router)
app.include_router(classify.router)
app.include_router(camera_monitor.router)

@app.get("/health")
async def health(db: AsyncSession = Depends(get_db)):
    r = await db.execute(text("select postgis_version()"))
    return {"postgis": r.scalar()}