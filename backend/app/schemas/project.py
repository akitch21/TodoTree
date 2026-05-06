import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr

from app.schemas.task import TaskTreeNode

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

class MemberUserInfo(BaseModel):
    id: uuid.UUID
    name: str
    email: str

    model_config = {"from_attributes": True}


class ProjectMemberResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    user: MemberUserInfo
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


class InvitationPreviewResponse(BaseModel):
    id: uuid.UUID
    email: str
    role: str
    status: InvitationStatus
    expires_at: datetime
    project_name: str

    model_config = {"from_attributes": False}


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


class MyInvitationResponse(InvitationResponse):
    project_name: str


# ── Project response schemas (split into list / detail) ────────────────────────

class ProjectListItem(BaseModel):
    """
    GET /api/projects/ が返す軽量プロジェクト情報。
    タスクツリーは含まない。集計値（task_count / done_count / overdue_count）
    は SQL の COUNT + FILTER で一括取得する。
    """
    id: uuid.UUID
    name: str
    description: str
    status: ProjectStatus
    created_at: datetime
    updated_at: datetime
    task_count: int = 0
    done_count: int = 0
    overdue_count: int = 0
    members: list[ProjectMemberResponse] = []

    model_config = {"from_attributes": False}


class ProjectDetailResponse(BaseModel):
    """
    GET /api/projects/{id} が返す詳細情報。
    タスクツリーは ORM relationship ではなく Python の build_task_tree() で構築済み。
    """
    id: uuid.UUID
    name: str
    description: str
    status: ProjectStatus
    created_at: datetime
    updated_at: datetime
    tasks: list[TaskTreeNode] = []
    members: list[ProjectMemberResponse] = []

    model_config = {"from_attributes": False}
