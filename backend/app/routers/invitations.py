"""
Invitation-related endpoints.

Two routers are exported:
  project_invitations_router  -- mounted at /api/projects
  invitations_router          -- mounted at /api/invitations
"""

import secrets
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models.project import Project, ProjectInvitation, ProjectMember
from app.models.user import User
from app.permissions import (
    can_invite_member,
    get_project_member,
    require_project_owner_or_admin,
)
from app.schemas.project import InvitationCreate, InvitationPreviewResponse, InvitationResponse

INVITATION_EXPIRE_DAYS = 7
TOKEN_BYTES = 32  # secrets.token_hex(32) produces 64 hex chars

# ── Router A: project-scoped endpoints ────────────────────────────────────────

project_invitations_router = APIRouter()


@project_invitations_router.post(
    "/{project_id}/invitations",
    response_model=InvitationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_invitation(
    project_id: uuid.UUID,
    body: InvitationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. Requester must be owner or admin
    await require_project_owner_or_admin(project_id, current_user.id, db)

    # 2. Check if the email already belongs to an active member
    existing_user_result = await db.execute(
        select(User).where(User.email == body.email)
    )
    target_user = existing_user_result.scalar_one_or_none()
    if target_user is not None:
        existing_member = await get_project_member(project_id, target_user.id, db)
        if existing_member is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This user is already a project member.",
            )

    # 3. Duplicate pending invitation check
    dup_result = await db.execute(
        select(ProjectInvitation).where(
            ProjectInvitation.project_id == project_id,
            ProjectInvitation.email == body.email,
            ProjectInvitation.status == "pending",
        )
    )
    if dup_result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A pending invitation for this email already exists.",
        )

    # 4. Seat limit check (free plan: max 4 seats)
    if not await can_invite_member(project_id, current_user, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Free plan invitation limit (4 seats) reached. Please upgrade to Pro.",
        )

    # 5. Create the invitation record
    inv_token = secrets.token_hex(TOKEN_BYTES)
    expires_at = datetime.now(timezone.utc) + timedelta(days=INVITATION_EXPIRE_DAYS)

    invitation = ProjectInvitation(
        project_id=project_id,
        email=str(body.email),
        role=body.role,
        token=inv_token,
        status="pending",
        expires_at=expires_at,
        invited_by_user_id=current_user.id,
    )
    db.add(invitation)
    await db.commit()
    await db.refresh(invitation)
    return invitation


@project_invitations_router.get(
    "/{project_id}/invitations",
    response_model=list[InvitationResponse],
)
async def list_invitations(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all invitations for a project (owner / admin only)."""
    await require_project_owner_or_admin(project_id, current_user.id, db)

    result = await db.execute(
        select(ProjectInvitation)
        .where(ProjectInvitation.project_id == project_id)
        .order_by(ProjectInvitation.created_at.desc())
    )
    return result.scalars().all()


@project_invitations_router.delete(
    "/{project_id}/invitations/{invitation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def revoke_invitation(
    project_id: uuid.UUID,
    invitation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Revoke a pending invitation (owner/admin only). Status-update only, no physical delete."""
    await require_project_owner_or_admin(project_id, current_user.id, db)

    result = await db.execute(
        select(ProjectInvitation).where(
            ProjectInvitation.id == invitation_id,
            ProjectInvitation.project_id == project_id,
        )
    )
    invitation = result.scalar_one_or_none()
    if invitation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found.",
        )
    if invitation.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending invitations can be revoked.",
        )

    invitation.status = "revoked"
    await db.commit()


# ── Router B: token-based accept endpoint ─────────────────────────────────────

invitations_router = APIRouter()



@invitations_router.get(
    "/{token}",
    response_model=InvitationPreviewResponse,
)
async def get_invitation_preview(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Public endpoint — returns invitation preview by token.
    Used to display project name / role before the user logs in.
    """
    result = await db.execute(
        select(ProjectInvitation)
        .where(ProjectInvitation.token == token)
        .options(selectinload(ProjectInvitation.project))
    )
    invitation = result.scalar_one_or_none()
    if invitation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found.",
        )
    return InvitationPreviewResponse(
        id=invitation.id,
        email=invitation.email,
        role=invitation.role,
        status=invitation.status,
        expires_at=invitation.expires_at,
        project_name=invitation.project.name,
    )


@invitations_router.post(
    "/{token}/accept",
    response_model=InvitationResponse,
)
async def accept_invitation(
    token: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Accept an invitation by token.

    Checks (in order):
    1. Token exists
    2. Status is pending
    3. Not expired
    4. Current user email matches invitation email
    5. User is not already a member
    Then creates a ProjectMember row and marks the invitation accepted.
    """
    # 1. Fetch invitation
    result = await db.execute(
        select(ProjectInvitation).where(ProjectInvitation.token == token)
    )
    invitation = result.scalar_one_or_none()
    if invitation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found.",
        )

    # 2. Status check
    if invitation.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This invitation has already been used or is no longer valid.",
        )

    # 3. Expiry check
    # asyncpg returns tz-aware datetimes for DateTime(timezone=True); guard for naive just in case
    now = datetime.now(timezone.utc)
    expires = invitation.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires <= now:
        invitation.status = "expired"
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This invitation has expired.",
        )

    # 4. Email match
    if current_user.email.lower() != invitation.email.lower():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This invitation was sent to a different email address.",
        )

    # 5. Already-a-member guard
    existing = await get_project_member(invitation.project_id, current_user.id, db)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already a member of this project.",
        )

    # 6. Create ProjectMember and mark invitation accepted
    new_member = ProjectMember(
        project_id=invitation.project_id,
        user_id=current_user.id,
        role=invitation.role,
    )
    db.add(new_member)
    invitation.status = "accepted"
    await db.commit()
    await db.refresh(invitation)
    return invitation
