import asyncio
import random
import time
import httpx

BASE_URL = "http://127.0.0.1:8000"

HAZARD_TYPES = ["waterlogging", "fire", "road_blockage", "accident"]

# Delhi ke aas-paas 6 alag "cluster" jagah (thoda spread out)
LOCATIONS = [
    {"lat": 28.6139, "lng": 77.2090},  # Connaught Place
    {"lat": 28.5355, "lng": 77.3910},  # Noida side
    {"lat": 28.4595, "lng": 77.0266},  # Gurugram side
    {"lat": 28.7041, "lng": 77.1025},  # North Delhi
    {"lat": 28.6304, "lng": 77.2177},  # India Gate area
    {"lat": 28.5245, "lng": 77.1855},  # South Delhi
]


def jitter(value):
    # chhota random shift taaki same jagah ke reports bilkul exact match na karein
    # (real duplicate reports jaisa lagega, but phir bhi clustering radius ke andar rahega)
    return value + random.uniform(-0.001, 0.001)


async def create_test_user(client):
    # unique email banate hain time ke basis pe, taaki baar-baar chalane pe conflict na ho
    unique_email = f"seeduser_{int(time.time())}@example.com"
    response = await client.post("/users", json={
        "email": unique_email,
        "username": "seed_bot",
        "role": "citizen"
    })
    response.raise_for_status()
    user = response.json()["user"]
    print(f"Test user created: {user['id']}")
    return user["id"]


async def seed_reports():
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        user_id = await create_test_user(client)

        for i, loc in enumerate(LOCATIONS):
            # kuch jagah 3-4 reports (verified banne ke liye), kuch jagah 1-2 (pending rahega)
            if i < 4:
                num_reports = random.randint(3, 4)   # verified honge
            else:
                num_reports = random.randint(1, 2)   # pending rahenge

            for _ in range(num_reports):
                payload = {
                    "hazard_type": random.choice(HAZARD_TYPES),
                    "lat": jitter(loc["lat"]),
                    "lng": jitter(loc["lng"]),
                    "severity": random.randint(1, 4),
                    "user_id": user_id
                }
                response = await client.post("/reports", json=payload)
                print(f"Location {i+1}: status {response.status_code} -> {response.json()}")

        print("Seeding complete!")


if __name__ == "__main__":
    asyncio.run(seed_reports())