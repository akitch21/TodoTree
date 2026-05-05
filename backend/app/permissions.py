"""
Shared permission helpers for project member / invitation operations.

All functions are async and take an open AsyncSession.
"""

import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import ProjectInvitation, ProjectMember
from app.models.user import User

# Maximum seats (members + pending invitations) for the free plan
FREE_PLAN_SEAT_LIMIT = 4


async def get_project_member(
    project_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> ProjectMember | None:
    """Return the ProjectMember row for this project/user pair, or None."""
    result = await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()


async def require_project_owner_or_admin(
    project_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> ProjectMember:
    """
    Assert that the given user is an owner or admin of the project.
    Raises 403 if not; 404 if the project member record doesn't exist at all.
    """
    member = await get_project_member(project_id, user_id, db)
    if member is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="このプロジェクトへのアクセス権がありません",
        )
    if member.role not in ("owner", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="この操作には owner または admin の権限が必要です",
        )
    return member


async def count_project_seats(project_id: uuid.UUID, db: AsyncSession) -> int:
    """
    Count the total number of occupied seats:
    active members + pending invitations.
    """
    member_count_result = await db.execute(
        select(func.count()).where(ProjectMember.project_id == project_id)
    )
    member_count: int = member_count_result.scalar_one()

    pending_count_result = await db.execute(
        select(func.count()).where(
            ProjectInvitation.project_id == project_id,
            ProjectInvitation.status == "pending",
        )
    )
    pending_count: int = pending_count_result.scalar_one()

    return member_count + pending_count


async def can_invite_member(
    project_id: uuid.UUID,
    requester: User,
    db: AsyncSession,
) -> bool:
    """
    Return True if the requester is allowed to invite another member.
    - free plan: total seats must be < FREE_PLAN_SEAT_LIMIT
    - pro plan: always True
    """
    if requester.plan == "pro":
        return True
    seats = await count_project_seats(project_id, db)
    return seats < FREE_PLAN_SEAT_LIMIT
