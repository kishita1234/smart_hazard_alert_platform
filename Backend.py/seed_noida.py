"""Noida Sector 61/62 & Mamura side — alag-alag locations pe verified incidents."""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import text
from config import settings

engine = create_async_engine(settings.DATABASE_URL)

# Noida — har point alag jagah (overlap nahi hoga)
NOIDA_LOCATIONS = [
    {"name": "Sector 61", "lat": 28.5984, "lng": 77.3691, "hazard_type": "waterlogging", "severity": 4, "status": "in_progress"},
    {"name": "Sector 62", "lat": 28.6018, "lng": 77.3762, "hazard_type": "waterlogging", "severity": 3, "status": "open"},
    {"name": "Mamura Village", "lat": 28.5921, "lng": 77.3614, "hazard_type": "road_blockage", "severity": 2, "status": "open"},
    {"name": "Sector 60 (Atta Market side)", "lat": 28.5956, "lng": 77.3648, "hazard_type": "waterlogging", "severity": 4, "status": "in_progress"},
    {"name": "Sector 63", "lat": 28.6042, "lng": 77.3825, "hazard_type": "fire", "severity": 4, "status": "open"},
]


async def seed():
    async with AsyncSession(engine) as session:
        for loc in NOIDA_LOCATIONS:
            await session.execute(
                text("""
                    insert into incidents (hazard_type, geom, severity, status, report_count, verified_at)
                    values (
                        :hazard_type,
                        ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                        :severity,
                        :status,
                        :report_count,
                        now()
                    )
                """),
                {
                    "hazard_type": loc["hazard_type"],
                    "lat": loc["lat"],
                    "lng": loc["lng"],
                    "severity": loc["severity"],
                    "status": loc["status"],
                    "report_count": 3,
                },
            )
            print(f"  + {loc['name']}: {loc['hazard_type']} (severity {loc['severity']})")

        await session.commit()
        print(f"\n{len(NOIDA_LOCATIONS)} Noida incidents inserted!")


if __name__ == "__main__":
    asyncio.run(seed())
