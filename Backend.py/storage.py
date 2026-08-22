from fastapi import APIRouter, UploadFile, File, HTTPException
from supabase import create_client
import uuid
from config import settings

router = APIRouter()

# supabase client (service key se — backend upload ke liye)
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
BUCKET = "report_images"

@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    # sirf image allow kar
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files allowed")

    # unique naam banao (taaki do file clash na karein)
    ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"

    # file ka content padho
    content = await file.read()

    # supabase storage me daalo
    try:
        supabase.storage.from_(BUCKET).upload(
            filename, content, {"content-type": file.content_type}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")

    # public URL banao aur wapas do
    url = supabase.storage.from_(BUCKET).get_public_url(filename)
    return {"image_url": url}