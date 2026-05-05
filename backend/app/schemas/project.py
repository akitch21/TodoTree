import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel

from app.schemas.task import TaskResponse

ProjectStatus = Literal["active", "completed", "archived"]


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
    role: Literal["owner", "member"] = "member"


# ── Response schemas ───────────────────────────────────────────────────────────

class ProjectMemberResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    role: str

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
