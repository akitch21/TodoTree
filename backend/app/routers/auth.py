from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import create_access_token, get_current_user, hash_password, verify_password
from app.database import get_db
from app.models.personal_task import PersonalTask
from app.models.project import Project, ProjectInvitation, ProjectMember
from app.models.task import Task
from app.models.user import User
from app.schemas.user import (
    TokenResponse,
    UserDeleteRequest,
    UserLogin,
    UserRegister,
    UserResponse,
)

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(body: UserRegister, db: AsyncSession = Depends(get_db)):
    # メールアドレス重複チェック
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="このメールアドレスは既に登録されています",
        )

    user = User(
        name=body.name,
        email=body.email,
        hashed_password=hash_password(body.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/login", response_model=TokenResponse)
async def login(body: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="メールアドレスまたはパスワードが正しくありません",
        )

    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_me(
    body: UserDeleteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.email.lower() != current_user.email.lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="退会確認用のメールアドレスが一致しません",
        )

    owner_memberships_result = await db.execute(
        select(ProjectMember).where(
            ProjectMember.user_id == current_user.id,
            ProjectMember.role == "owner",
        )
    )
    owner_memberships = owner_memberships_result.scalars().all()
    project_ids_to_delete = []

    for owner_membership in owner_memberships:
        other_members_result = await db.execute(
            select(ProjectMember)
            .where(
                ProjectMember.project_id == owner_membership.project_id,
                ProjectMember.user_id != current_user.id,
            )
            .order_by(ProjectMember.created_at.asc())
        )
        other_members = other_members_result.scalars().all()
        if not other_members:
            project_ids_to_delete.append(owner_membership.project_id)
            continue

        next_owner = next(
            (member for member in other_members if member.role == "admin"),
            other_members[0],
        )
        next_owner.role = "owner"

    if project_ids_to_delete:
        await db.execute(delete(Project).where(Project.id.in_(project_ids_to_delete)))

    await db.execute(update(Task).where(Task.assignee_id == current_user.id).values(assignee_id=None))
    await db.execute(delete(PersonalTask).where(PersonalTask.user_id == current_user.id))
    await db.execute(delete(ProjectMember).where(ProjectMember.user_id == current_user.id))
    await db.execute(
        delete(ProjectInvitation).where(
            (ProjectInvitation.invited_by_user_id == current_user.id)
            | (ProjectInvitation.email == current_user.email)
        )
    )
    await db.execute(delete(User).where(User.id == current_user.id))
    await db.commit()
