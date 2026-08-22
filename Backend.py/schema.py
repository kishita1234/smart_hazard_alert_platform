from pydantic import BaseModel, EmailStr

# users ke liye — POST /users me kya aayega
class UserCreate(BaseModel):
    email: EmailStr
    username: str
    role: str = "citizen"      # default citizen

# reports ke liye — POST /reports me kya aayega
class ReportCreate(BaseModel):
    hazard_type: str
    lat: float
    lng: float
    severity: int | None = None    # optional (AI baad me bharega)
    user_id: str | None = None     # optional abhi
    image_url: str | None = None