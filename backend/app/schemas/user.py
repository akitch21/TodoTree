import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr


# ── Request schemas ────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


# ── Response schemas ───────────────────────────────────────────────────────────

class UserResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    avatar: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
