import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models.personal_task import PersonalTask
from app.models.user import User
from app.schemas.personal_task import (
    PersonalTaskCreate,
    PersonalTaskResponse,
    PersonalTaskUpdate,
)

router = APIRouter()


@router.get("/", response_model=list[PersonalTaskResponse])
async def list_personal_tasks(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PersonalTask)
        .where(PersonalTask.user_id == current_user.id)
        .order_by(PersonalTask.created_at.desc())
    )
    return result.scalars().all()


@router.post("/", response_model=PersonalTaskResponse, status_code=status.HTTP_201_CREATED)
async def create_personal_task(
    body: PersonalTaskCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    task = PersonalTask(user_id=current_user.id, **body.model_dump())
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


@router.patch("/{task_id}", response_model=PersonalTaskResponse)
async def update_personal_task(
    task_id: uuid.UUID,
    body: PersonalTaskUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PersonalTask).where(
            PersonalTask.id == task_id,
            PersonalTask.user_id == current_user.id,
        )
    )
    task = result.scalar_one_or_none()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    await db.commit()
    await db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_personal_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PersonalTask).where(
            PersonalTask.id == task_id,
            PersonalTask.user_id == current_user.id,
        )
    )
    task = result.scalar_one_or_none()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    await db.delete(task)
    await db.commit()
