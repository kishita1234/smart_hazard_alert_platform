import asyncio
import random
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import text
from config import settings

# Same DATABASE_URL use kar rahe hain jo config.py mein already hai
engine = create_async_engine(settings.DATABASE_URL)

HAZARD_TYPES = ["waterlogging", "fire", "road_blockage"]
STATUSES = ["open", "in_progress", "resolved"]

# Delhi ke aas-paas ke coordinates (thoda random spread ke saath)
BASE_LAT = 28.6139
BASE_LNG = 77.2090


def random_offset():
    # chhota random shift taaki sab points ek jagah pe overlap na karein
    return random.uniform(-0.05, 0.05)


async def seed():
    async with AsyncSession(engine) as session:
        for i in range(18):
            hazard_type = random.choice(HAZARD_TYPES)
            severity = random.randint(1, 4)
            status = random.choice(STATUSES)
            lat = BASE_LAT + random_offset()
            lng = BASE_LNG + random_offset()

            # kuch verified, kuch pending (verified_at null) — 50-50 split jaisa
            is_verified = random.choice([True, False])
            verified_at = "now()" if is_verified else None

            query = text(f"""
                insert into incidents (hazard_type, geom, severity, status, report_count, verified_at)
                values (
                    :hazard_type,
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                    :severity,
                    :status,
                    :report_count,
                    {verified_at if verified_at else 'NULL'}
                )
            """)

            await session.execute(query, {
                "hazard_type": hazard_type,
                "lat": lat,
                "lng": lng,
                "severity": severity,
                "status": status,
                "report_count": random.randint(1, 5)
            })

        await session.commit()
        print("18 fake incidents inserted successfully!")


if __name__ == "__main__":
    asyncio.run(seed())