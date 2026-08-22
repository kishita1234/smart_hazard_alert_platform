from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from db import get_db
from schema import ReportCreate

router = APIRouter()

# --- clustering ke rules (ek jagah, badalna ho to yahin) ---
RADIUS_M = 100          # itne meter ke andar = same cluster
THRESHOLD = 3           # itne reports pe incident verified
TIME_WINDOW = "1 hour"  # itni der ke andar ke reports ek saath


# ============ POST /reports — naya report + clustering ============
@router.post("/reports")
async def create_report(report: ReportCreate, db: AsyncSession = Depends(get_db)):
    point = "ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography"
    params = {
        "hazard_type": report.hazard_type,
        "lng": report.lng,
        "lat": report.lat,
        "severity": report.severity,
        "user_id": report.user_id,
        "image_url": report.image_url,
    }

    # STEP 1: report insert
    res = await db.execute(text(f"""
        insert into reports (user_id, hazard_type, geom, severity, image_url)
        values (:user_id, :hazard_type, {point}, :severity, :image_url)
        returning id
    """), params)
    report_id = res.scalar()

    # STEP 2: paas ka open incident dhundo
    res = await db.execute(text(f"""
        select id, report_count from incidents
        where hazard_type = :hazard_type
          and status = 'open'
          and created_at > now() - interval '{TIME_WINDOW}'
          and ST_DWithin(geom, {point}, :radius)
        order by ST_Distance(geom, {point})
        limit 1
    """), {**params, "radius": RADIUS_M})
    incident = res.mappings().first()

    if incident:
        # STEP 3a: mila -> jodo + count badhao + 3 pe verify
        incident_id = incident["id"]
        new_count = incident["report_count"] + 1
        verified = new_count >= THRESHOLD

        await db.execute(
            text("update reports set incident_id = :iid where id = :rid"),
            {"iid": incident_id, "rid": report_id},
        )
        if verified:
            await db.execute(
                text("""
                    update incidents
                    set report_count = :count,
                        verified_at = coalesce(verified_at, now())
                    where id = :iid
                """),
                {"count": new_count, "iid": incident_id},
            )
        else:
            await db.execute(
                text("update incidents set report_count = :count where id = :iid"),
                {"count": new_count, "iid": incident_id},
            )
    else:
        # STEP 3b: kuch nahi mila -> naya incident banao
        res = await db.execute(text(f"""
            insert into incidents (hazard_type, geom, severity, report_count)
            values (:hazard_type, {point}, :severity, 1)
            returning id
        """), params)
        incident_id = res.scalar()
        await db.execute(
            text("update reports set incident_id = :iid where id = :rid"),
            {"iid": incident_id, "rid": report_id},
        )
        verified = False

    await db.commit()
    return {"report_id": str(report_id), "incident_id": str(incident_id), "verified": verified}


# ============ GET /reports — saari reports (filters ke saath) ============
@router.get("/reports")
async def list_reports(
    hazard_type: Optional[str] = None,
    status: Optional[str] = None,
    severity: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
):
    sql = """select id, hazard_type, status, severity,
                    ST_Y(geom::geometry) as lat,
                    ST_X(geom::geometry) as lng,
                    created_at
             from reports"""
    conditions = []
    params = {}
    if hazard_type:
        conditions.append("hazard_type = :hazard_type")
        params["hazard_type"] = hazard_type
    if status:
        conditions.append("status = :status")
        params["status"] = status
    if severity:
        conditions.append("severity = :severity")
        params["severity"] = severity
    if conditions:
        sql += " where " + " and ".join(conditions)
    sql += " order by created_at desc"

    res = await db.execute(text(sql), params)
    return {"reports": [dict(r) for r in res.mappings().all()]}


# ============ GET /reports/{report_id} — ek report ka detail ============
@router.get("/reports/{report_id}")
async def get_report(report_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        text("""
            select id, hazard_type, status, severity,
                   ST_Y(geom::geometry) as lat,
                   ST_X(geom::geometry) as lng,
                   incident_id, created_at
            from reports
            where id = :report_id
        """),
        {"report_id": report_id},
    )
    row = res.mappings().first()
    if row is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"report": dict(row)}