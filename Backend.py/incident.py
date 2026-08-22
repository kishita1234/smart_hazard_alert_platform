from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from db import get_db

router = APIRouter()

@router.get("/incidents")
async def get_incidents(db: AsyncSession = Depends(get_db)):
    query = text("""
        select id, hazard_type, severity, status, report_count,
               verified_at, created_at,
               ST_X(geom::geometry) as longitude,
               ST_Y(geom::geometry) as latitude
        from incidents
        where verified_at is not null
          and status != 'resolved'
        order by severity desc, created_at desc
    """)
    result = await db.execute(query)
    rows = result.mappings().all()
    return {"incidents": [dict(row) for row in rows]}