from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from db import get_db
from schema import ReportCreate

router = APIRouter()

@router.post("/reports")
async def create_report(report: ReportCreate, db: AsyncSession = Depends(get_db)):
    query = text("""
        insert into reports (user_id, hazard_type, geom, severity)
        values (
            :user_id,
            :hazard_type,
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
            :severity
        )
        returning id, hazard_type, status, created_at
    """)
    result = await db.execute(query, {
        "user_id": report.user_id,
        "hazard_type": report.hazard_type,
        "lng": report.lng,
        "lat": report.lat,
        "severity": report.severity,
    })
    await db.commit()
    row = result.mappings().first()
    return {"report": dict(row)}