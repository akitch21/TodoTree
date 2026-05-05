from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel

PersonalTaskStatus = Literal["pending", "in_progress", "done"]


class PersonalTaskCreate(BaseModel):
    text: str
    description: str = ""
    status: PersonalTaskStatus = "pending"
    due_date: date | None = None
    project_ref: str | None = None


class PersonalTaskUpdate(BaseModel):
    text: str | None = None
    description: str | None = None
    status: PersonalTaskStatus | None = None
    due_date: date | None = None
    project_ref: str | None = None


class PersonalTaskResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    text: str
    description: str
    status: PersonalTaskStatus
    due_date: date | None
    project_ref: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
