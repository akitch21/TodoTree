"""
Project API router.

設計方針:
  GET /api/projects/
    - プロジェクト一覧（軽量）
    - タスクツリーは含まない
    - task_count / done_count / overdue_count を SQL で集計（N+1 なし）

  GET /api/projects/{id}
    - プロジェクト詳細
    - タスクを `SELECT * FROM tasks WHERE project_id = ?` でフラット取得
    - build_task_tree() で Python 側ツリー構築（ORM の lazy="raise" に触れない）

  POST / PATCH
    - 作成・更新は ProjectListItem を返す（task 不要）

lazy="raise" を維持する理由:
  ORM の .children への意図しないアクセスを即座にエラーで検出するため。
  eager load 漏れをサイレントに N+1 にしないための安全装置。
"""
import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
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
    ProjectDetailResponse,
    ProjectListItem,
    ProjectMemberAdd,
    ProjectMemberResponse,
    ProjectUpdate,
)
from app.utils.task_tree import build_task_tree

router = APIRouter()


# ── Internal helpers ───────────────────────────────────────────────────────────

def _member_load_opts():
    """メンバーと紐づくユーザー情報を eager load する共通オプション。"""
    return [selectinload(Project.members).selectinload(ProjectMember.user)]


async def _require_member(
    project_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> ProjectMember:
    """プロジェクトメンバーでなければ 404 を返す（プロジェクト存在有無を外部に漏らさない）。"""
    member = await get_project_member(project_id, user_id, db)
    if member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return member


async def _build_list_item(
    project: Project,
    task_count: int,
    done_count: int,
    overdue_count: int,
) -> ProjectListItem:
    """Project ORM オブジェクトから ProjectListItem を組み立てる。"""
    return ProjectListItem(
        id=project.id,
        name=project.name,
        description=project.description,
        status=project.status,
        created_at=project.created_at,
        updated_at=project.updated_at,
        task_count=task_count,
        done_count=done_count,
        overdue_count=overdue_count,
        members=[ProjectMemberResponse.model_validate(m) for m in project.members],
    )


async def _fetch_task_counts(
    project_ids: list[uuid.UUID],
    db: AsyncSession,
) -> dict[uuid.UUID, tuple[int, int, int]]:
    """
    project_ids に含まれるプロジェクトのタスク集計を 1 クエリで取得。

    Returns:
        { project_id: (task_count, done_count, overdue_count) }
    """
    if not project_ids:
        return {}

    today = date.today()
    result = await db.execute(
        select(
            Task.project_id,
            func.count(Task.id).label("task_count"),
            func.count(Task.id).filter(Task.status == "done").label("done_count"),
            func.count(Task.id).filter(
                Task.status != "done",
                Task.due_date.isnot(None),
                Task.due_date < today,
            ).label("overdue_count"),
        )
        .where(Task.project_id.in_(project_ids))
        .group_by(Task.project_id)
    )
    return {
        row.project_id: (row.task_count, row.done_count, row.overdue_count)
        for row in result
    }


# ── Project CRUD ───────────────────────────────────────────────────────────────

@router.get("/", response_model=list[ProjectListItem])
async def list_projects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    ログインユーザーが参加しているプロジェクト一覧を返す。
    タスクツリーは含まず、集計値のみ提供する（高速・スケーラブル）。
    """
    result = await db.execute(
        select(Project)
        .join(ProjectMember, ProjectMember.project_id == Project.id)
        .where(ProjectMember.user_id == current_user.id)
        .options(*_member_load_opts())
        .distinct()
    )
    projects = result.scalars().all()

    if not projects:
        return []

    project_ids = [p.id for p in projects]
    counts = await _fetch_task_counts(project_ids, db)

    return [
        await _build_list_item(p, *counts.get(p.id, (0, 0, 0)))
        for p in projects
    ]


@router.post("/", response_model=ProjectListItem, status_code=status.HTTP_201_CREATED)
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

    # 作成直後はタスクなし → counts = (0, 0, 0)
    result = await db.execute(
        select(Project)
        .where(Project.id == project.id)
        .options(*_member_load_opts())
    )
    project = result.scalar_one()
    return await _build_list_item(project, 0, 0, 0)


@router.get("/{project_id}", response_model=ProjectDetailResponse)
async def get_project(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    プロジェクト詳細（タスクツリー付き）を返す。

    タスク取得戦略:
      1. `SELECT * FROM tasks WHERE project_id = ?` でフラット全件取得（1 クエリ）
      2. build_task_tree() で parent_id を使い Python 側でツリー構築
      3. ORM の children リレーションには一切アクセスしない → lazy="raise" 安全
    """
    await _require_member(project_id, current_user.id, db)

    # プロジェクト + メンバー（タスクなし）
    proj_result = await db.execute(
        select(Project)
        .where(Project.id == project_id)
        .options(*_member_load_opts())
    )
    project = proj_result.scalar_one_or_none()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    # タスクをフラットで取得（ORM の relationship は使わない）
    tasks_result = await db.execute(
        select(Task)
        .where(Task.project_id == project_id)
        .order_by(Task.created_at)
    )
    flat_tasks = tasks_result.scalars().all()

    return ProjectDetailResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        status=project.status,
        created_at=project.created_at,
        updated_at=project.updated_at,
        tasks=build_task_tree(flat_tasks),
        members=[ProjectMemberResponse.model_validate(m) for m in project.members],
    )


@router.patch("/{project_id}", response_model=ProjectListItem)
async def update_project(
    project_id: uuid.UUID,
    body: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """プロジェクト情報を更新する。owner / admin のみ。"""
    await require_project_owner_or_admin(project_id, current_user.id, db)

    result = await db.execute(
        select(Project)
        .where(Project.id == project_id)
        .options(*_member_load_opts())
    )
    project = result.scalar_one_or_none()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    await db.commit()

    result = await db.execute(
        select(Project)
        .where(Project.id == project_id)
        .options(*_member_load_opts())
    )
    project = result.scalar_one()
    counts = await _fetch_task_counts([project_id], db)
    return await _build_list_item(project, *counts.get(project_id, (0, 0, 0)))


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """プロジェクトを削除する。owner のみ。"""
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
    """メンバーを直接追加する。owner / admin のみ。"""
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
    """メンバーを削除する。owner / admin のみ。"""
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
