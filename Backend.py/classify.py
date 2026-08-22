import sys, os, tempfile, requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

# AI folder ka path add karo taaki Classifier import ho
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "AI"))
from Classifier import classify_image

router = APIRouter()

class ClassifyRequest(BaseModel):
    image_url: str

@router.post("/classify")
def classify(req: ClassifyRequest):
    # 1. URL se image download karke temp file me rakho
    try:
        resp = requests.get(req.image_url, timeout=15)
        resp.raise_for_status()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image download failed: {e}")

    ext = req.image_url.split(".")[-1].split("?")[0][:4] or "png"
    with tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}") as tmp:
        tmp.write(resp.content)
        tmp_path = tmp.name

    # 2. AI classify chalao
    try:
        result = classify_image(tmp_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Classification failed: {e}")
    finally:
        os.remove(tmp_path)  # temp file hatao

    # 3. result wapas do
    return {"result": result}