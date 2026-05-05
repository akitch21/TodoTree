import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import get_current_user
from app.database import get_db
from app.models.project import Project, ProjectMember
from app.models.task import Task
from app.models.user import User
from app.permissions import get_project_member, require_project_owner_or_admin
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
        selectinload(Project.members).selectinload(ProjectMember.user),
    ]


async def _require_member(
    project_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> ProjectMember:
    """Raise 404 if the project does not exist or the user is not a member.
    Returns 404 (not 403) so that project existence is not leaked to outsiders.
    """
    member = await get_project_member(project_id, user_id, db)
    if member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return member


# ── Project CRUD ───────────────────────────────────────────────────────────────

@router.get("/", response_model=list[ProjectResponse])
async def list_projects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return only the projects the current user is a member of."""
    result = await db.execute(
        select(Project)
        .join(ProjectMember, ProjectMember.project_id == Project.id)
        .where(ProjectMember.user_id == current_user.id)
        .options(*_load_opts())
    )
    return result.scalars().all()


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    body: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = Project(**body.model_dump())
    db.add(project)
    await db.flush()

    owner_member = ProjectMember(
        project_id=project.id,
        user_id=current_user.id,
        role="owner",
    )
    db.add(owner_member)
    await db.commit()

    result = await db.execute(
        select(Project).where(Project.id == project.id).options(*_load_opts())
    )
    return result.scalar_one()


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return a project only if the current user is a member."""
    await _require_member(project_id, current_user.id, db)
    result = await db.execute(
        select(Project).where(Project.id == project_id).options(*_load_opts())
    )
    return result.scalar_one()


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: uuid.UUID,
    body: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a project. Requires owner or admin."""
    await require_project_owner_or_admin(project_id, current_user.id, db)

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
async def delete_project(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a project. Only the owner can delete."""
    member = await _require_member(project_id, current_user.id, db)
    if member.role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the project owner can delete a project.",
        )

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
    project_id: uuid.UUID,
    body: ProjectMemberAdd,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a member directly. Requires owner or admin."""
    await require_project_owner_or_admin(project_id, current_user.id, db)
    member = ProjectMember(project_id=project_id, **body.model_dump())
    db.add(member)
    await db.commit()
    result = await db.execute(
        select(ProjectMember)
        .where(ProjectMember.id == member.id)
        .options(selectinload(ProjectMember.user))
    )
    return result.scalar_one()


@router.delete("/{project_id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    project_id: uuid.UUID,
    member_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a member. Requires owner or admin."""
    await require_project_owner_or_admin(project_id, current_user.id, db)

    result = await db.execute(
        select(ProjectMember).where(
            ProjectMember.id == member_id,
            ProjectMember.project_id == project_id,
        )
    )
    member = result.scalar_one_or_none()
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")
    await db.delete(member)
    await db.commit()
