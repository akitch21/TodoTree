import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.project import Project, ProjectMember
from app.models.task import Task
from app.schemas.project import (
    ProjectCreate,
    ProjectMemberAdd,
    ProjectMemberResponse,
    ProjectResponse,
    ProjectUpdate,
)

router = APIRouter()


def _load_opts():
    return [
        selectinload(Project.tasks)
            .selectinload(Task.children)
            .selectinload(Task.children),
        selectinload(Project.members),
    ]


@router.get("/", response_model=list[ProjectResponse])
async def list_projects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).options(*_load_opts()))
    return result.scalars().all()


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(body: ProjectCreate, db: AsyncSession = Depends(get_db)):
    project = Project(**body.model_dump())
    db.add(project)
    await db.commit()
    result = await db.execute(
        select(Project).where(Project.id == project.id).options(*_load_opts())
    )
    return result.scalar_one()


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Project).where(Project.id == project_id).options(*_load_opts())
    )
    project = result.scalar_one_or_none()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: uuid.UUID, body: ProjectUpdate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Project).where(Project.id == project_id).options(*_load_opts())
    )
    project = result.scalar_one_or_none()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    await db.commit()
    result = await db.execute(
        select(Project).where(Project.id == project_id).options(*_load_opts())
    )
    return result.scalar_one()


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    await db.delete(project)
    await db.commit()


# ── Members ────────────────────────────────────────────────────────────────────

@router.post(
    "/{project_id}/members",
    response_model=ProjectMemberResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_member(
    project_id: uuid.UUID, body: ProjectMemberAdd, db: AsyncSession = Depends(get_db)
):
    member = ProjectMember(project_id=project_id, **body.model_dump())
    db.add(member)
    await db.commit()
    await db.refresh(member)
    return member


@router.delete("/{project_id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    project_id: uuid.UUID, member_id: uuid.UUID, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(ProjectMember).where(
            ProjectMember.id == member_id, ProjectMember.project_id == project_id
        )
    )
    member = result.scalar_one_or_none()
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")
    await db.delete(member)
    await db.commit()
