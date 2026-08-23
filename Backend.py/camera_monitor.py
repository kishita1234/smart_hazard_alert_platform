import sys, os, cv2, tempfile
from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends
from db import get_db

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "AI"))
from Classifier import classify_image

router = APIRouter()

VIDEO_PATH = "test_video.mp4"   # tera video naam
CAM_LAT = 28.6139               # camera ki fixed location (waterlogging spot)
CAM_LNG = 77.2090
FRAMES_TO_CHECK = 5             # video se itne frames check karo

@router.post("/camera/scan")
async def camera_scan(db: AsyncSession = Depends(get_db)):
    cap = cv2.VideoCapture(VIDEO_PATH)
    if not cap.isOpened():
        raise HTTPException(status_code=400, detail=f"Video nahi khula: {VIDEO_PATH}")

    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    step = max(total // FRAMES_TO_CHECK, 1)
    results = []
    detected = None

    for i in range(FRAMES_TO_CHECK):
        cap.set(cv2.CAP_PROP_POS_FRAMES, i * step)
        ok, frame = cap.read()
        if not ok:
            break
        # frame ko temp file me save karo
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
            cv2.imwrite(tmp.name, frame)
            tmp_path = tmp.name
        try:
            res = classify_image(tmp_path)
            results.append(res)
            # koi valid hazard mila (unverified nahi) to pakdo
            if res.get("type") not in ("unverified", "no_waterlogging") and res.get("confidence", 0) >= 0.7:
                detected = res
                break
        finally:
            os.remove(tmp_path)

    cap.release()

    # hazard detect hua -> incident bana do
    if detected:
        point = "ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography"
        r = await db.execute(text(f"""
            insert into incidents (hazard_type, geom, severity, report_count, verified_at)
            values (:hazard_type, {point}, :severity, 1, now())
            returning id
        """), {
            "hazard_type": detected["type"],
            "lng": CAM_LNG, "lat": CAM_LAT,
            "severity": detected["severity"],
        })
        await db.commit()
        return {
            "camera_detected": True,
            "incident_id": str(r.scalar()),
            "result": detected,
            "source": "camera",
        }

    return {"camera_detected": False, "checked": results}