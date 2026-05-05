import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr

from app.schemas.task import TaskResponse

ProjectStatus = Literal["active", "completed", "archived"]
MemberRole = Literal["owner", "admin", "member"]
InvitationStatus = Literal["pending", "accepted", "expired", "revoked"]


# ── Request schemas ────────────────────────────────────────────────────────────

class ProjectCreate(BaseModel):
    name: str
    description: str = ""
    status: ProjectStatus = "active"


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    status: ProjectStatus | None = None


class ProjectMemberAdd(BaseModel):
    user_id: uuid.UUID
    role: MemberRole = "member"


class InvitationCreate(BaseModel):
    email: EmailStr
    role: MemberRole = "member"


# ── Response schemas ───────────────────────────────────────────────────────────

class ProjectMemberResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


class InvitationResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    email: str
    role: str
    token: str
    status: InvitationStatus
    expires_at: datetime
    invited_by_user_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class ProjectResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str
    status: ProjectStatus
    created_at: datetime
    updated_at: datetime
    tasks: list[TaskResponse] = []
    members: list[ProjectMemberResponse] = []

    model_config = {"from_attributes": True}
