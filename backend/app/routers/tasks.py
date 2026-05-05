import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate

router = APIRouter()


def _load_opts():
    # Recursively load children (2 levels deep is enough for most UIs)
    return [
        selectinload(Task.children).selectinload(Task.children),
    ]


@router.get("/project/{project_id}", response_model=list[TaskResponse])
async def list_project_tasks(project_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Return root-level tasks for a project (children are nested inside)."""
    result = await db.execute(
        select(Task)
        .where(Task.project_id == project_id, Task.parent_id.is_(None))
        .options(*_load_opts())
    )
    return result.scalars().all()


@router.post("/project/{project_id}", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    project_id: uuid.UUID, body: TaskCreate, db: AsyncSession = Depends(get_db)
):
    task = Task(project_id=project_id, **body.model_dump())
    db.add(task)
    await db.commit()
    await db.refresh(task, ["children"])
    return task


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Task).where(Task.id == task_id).options(*_load_opts())
    )
    task = result.scalar_one_or_none()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: uuid.UUID, body: TaskUpdate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Task).where(Task.id == task_id).options(*_load_opts())
    )
    task = result.scalar_one_or_none()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    await db.commit()
    result = await db.execute(
        select(Task).where(Task.id == task_id).options(*_load_opts())
    )
    return result.scalar_one()


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    await db.delete(task)
    await db.commit()
