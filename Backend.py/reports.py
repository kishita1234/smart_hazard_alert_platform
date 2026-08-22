from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from db import get_db
from schema import ReportCreate

router = APIRouter()

RADIUS_M = 100
THRESHOLD = 3
TIME_WINDOW = "1 hour"

@router.post("/reports")
async def create_report(report: ReportCreate, db: AsyncSession = Depends(get_db)):
    point = "ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography"
    params = {
        "hazard_type": report.hazard_type,
        "lng": report.lng,
        "lat": report.lat,
        "severity": report.severity,
        "user_id": report.user_id,
    }

    # STEP 1: report insert
    res = await db.execute(text(f"""
        insert into reports (user_id, hazard_type, geom, severity)
        values (:user_id, :hazard_type, {point}, :severity)
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