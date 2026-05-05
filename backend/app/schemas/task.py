from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel

TaskStatus = Literal["pending", "in_progress", "done"]


# ── Request schemas ────────────────────────────────────────────────────────────

class TaskCreate(BaseModel):
    title: str
    description: str = ""
    status: TaskStatus = "pending"
    parent_id: uuid.UUID | None = None
    assignee_id: uuid.UUID | None = None
    due_date: date | None = None


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: TaskStatus | None = None
    assignee_id: uuid.UUID | None = None
    due_date: date | None = None
    parent_id: uuid.UUID | None = None


# ── Response schemas ───────────────────────────────────────────────────────────

class TaskResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    parent_id: uuid.UUID | None
    title: str
    description: str
    status: TaskStatus
    assignee_id: uuid.UUID | None
    due_date: date | None
    created_at: datetime
    updated_at: datetime
    children: list[TaskResponse] = []

    model_config = {"from_attributes": True}


# Enable forward reference
TaskResponse.model_rebuild()
