from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
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


class IncidentStatusUpdate(BaseModel):
    status: str


ALLOWED_TRANSITIONS = {
    "open": ["in_progress", "resolved"],
    "in_progress": ["resolved"],
    "resolved": []
}


@router.patch("/incidents/{incident_id}")
async def update_incident_status(
    incident_id: str,
    update: IncidentStatusUpdate,
    db: AsyncSession = Depends(get_db)
):
    current = await db.execute(
        text("select status from incidents where id = :id"),
        {"id": incident_id}
    )
    row = current.mappings().first()

    if not row:
        raise HTTPException(status_code=404, detail="Incident not found")

    current_status = row["status"]
    new_status = update.status

    if new_status not in ALLOWED_TRANSITIONS.get(current_status, []):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot change status from '{current_status}' to '{new_status}'"
        )

    result = await db.execute(
        text("""
            update incidents
            set status = :status
            where id = :id
            returning id, hazard_type, severity, status, report_count, verified_at, created_at
        """),
        {"status": new_status, "id": incident_id}
    )
    await db.commit()

    updated_row = result.mappings().first()
    return {"incident": dict(updated_row)}