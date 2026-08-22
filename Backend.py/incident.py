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


@router.get("/incidents/nearby")
async def get_nearby_incidents(
    lat: float,
    lng: float,
    radius: float = 2000,
    db: AsyncSession = Depends(get_db)
):
    query = text("""
        select id, hazard_type, severity, status, report_count,
               verified_at, created_at,
               ST_X(geom::geometry) as longitude,
               ST_Y(geom::geometry) as latitude,
               ST_Distance(geom, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography) as distance_meters
        from incidents
        where verified_at is not null
          and ST_DWithin(geom, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)
        order by distance_meters asc
    """)
    result = await db.execute(query, {"lat": lat, "lng": lng, "radius": radius})
    rows = result.mappings().all()
    return {"incidents": [dict(row) for row in rows]}


@router.get("/incidents/stats")
async def get_incident_stats(db: AsyncSession = Depends(get_db)):
    hazard_query = text("""
        select hazard_type, count(*) as total
        from incidents
        group by hazard_type
        order by total desc
    """)
    hazard_result = await db.execute(hazard_query)
    hazard_counts = hazard_result.mappings().all()

    status_query = text("""
        select
            count(*) filter (where verified_at is not null) as verified_count,
            count(*) filter (where verified_at is null) as pending_count
        from incidents
    """)
    status_result = await db.execute(status_query)
    status_row = status_result.mappings().first()

    hotspot_query = text("""
        select
            round(ST_Y(geom::geometry)::numeric, 2) as area_lat,
            round(ST_X(geom::geometry)::numeric, 2) as area_lng,
            count(*) as total_incidents,
            count(*) filter (where verified_at is not null) as verified_incidents
        from incidents
        group by area_lat, area_lng
        order by total_incidents desc
        limit 10
    """)
    hotspot_result = await db.execute(hotspot_query)
    hotspots = hotspot_result.mappings().all()

    return {
        "by_hazard_type": [dict(row) for row in hazard_counts],
        "verified_vs_pending": dict(status_row),
        "hotspots": [dict(row) for row in hotspots]
    }


@router.get("/incidents/{incident_id}")
async def get_incident_detail(incident_id: str, db: AsyncSession = Depends(get_db)):
    incident_query = text("""
        select id, hazard_type, severity, status, report_count,
               verified_at, created_at,
               ST_X(geom::geometry) as longitude,
               ST_Y(geom::geometry) as latitude
        from incidents
        where id = :id
    """)
    incident_result = await db.execute(incident_query, {"id": incident_id})
    incident_row = incident_result.mappings().first()

    if not incident_row:
        raise HTTPException(status_code=404, detail="Incident not found")

    reports_query = text("""
        select id, user_id, hazard_type, severity, image_url, status, created_at,
               ST_X(geom::geometry) as longitude,
               ST_Y(geom::geometry) as latitude
        from reports
        where incident_id = :id
        order by created_at desc
    """)
    reports_result = await db.execute(reports_query, {"id": incident_id})
    report_rows = reports_result.mappings().all()

    return {
        "incident": dict(incident_row),
        "reports": [dict(r) for r in report_rows]
    }


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