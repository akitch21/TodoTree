"""
Task API のテスト。

カバレッジ:
  - 認証なし (401)
  - プロジェクト非メンバー (404)
  - プロジェクトメンバー (正常系 CRUD)
  - task_id 経由のエンドポイントでも project membership チェックが効いていること
"""

import pytest
from httpx import AsyncClient


# ── Helpers ────────────────────────────────────────────────────────────────────

async def _register_and_token(client: AsyncClient, email: str, name: str = "Test User") -> str:
    """ユーザー登録してJWTトークンを返す。"""
    resp = await client.post(
        "/api/auth/register",
        json={"name": name, "email": email, "password": "password123"},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["access_token"]


async def _create_project(client: AsyncClient, token: str, name: str = "Test Project") -> str:
    """プロジェクトを作成してproject_idを返す。"""
    resp = await client.post(
        "/api/projects/",
        json={"name": name, "description": "", "status": "active"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


async def _create_task(client: AsyncClient, token: str, project_id: str, title: str = "Test Task") -> str:
    """タスクを作成してtask_idを返す。"""
    resp = await client.post(
        f"/api/tasks/project/{project_id}",
        json={"title": title, "description": "", "status": "pending"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


# ── 認証なし (401) ─────────────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_list_tasks_unauthenticated(client: AsyncClient) -> None:
    """未認証ユーザーはタスク一覧を取得できない。"""
    import uuid
    resp = await client.get(f"/api/tasks/project/{uuid.uuid4()}")
    assert resp.status_code == 403  # HTTPBearer は Authorizationヘッダーなしで403


@pytest.mark.anyio
async def test_create_task_unauthenticated(client: AsyncClient) -> None:
    """未認証ユーザーはタスクを作成できない。"""
    import uuid
    resp = await client.post(
        f"/api/tasks/project/{uuid.uuid4()}",
        json={"title": "Intruder task", "description": "", "status": "pending"},
    )
    assert resp.status_code == 403


@pytest.mark.anyio
async def test_get_task_unauthenticated(client: AsyncClient) -> None:
    """未認証ユーザーはタスク詳細を取得できない。"""
    import uuid
    resp = await client.get(f"/api/tasks/{uuid.uuid4()}")
    assert resp.status_code == 403


@pytest.mark.anyio
async def test_update_task_unauthenticated(client: AsyncClient) -> None:
    """未認証ユーザーはタスクを更新できない。"""
    import uuid
    resp = await client.patch(
        f"/api/tasks/{uuid.uuid4()}",
        json={"status": "done"},
    )
    assert resp.status_code == 403


@pytest.mark.anyio
async def test_delete_task_unauthenticated(client: AsyncClient) -> None:
    """未認証ユーザーはタスクを削除できない。"""
    import uuid
    resp = await client.delete(f"/api/tasks/{uuid.uuid4()}")
    assert resp.status_code == 403


# ── プロジェクト非メンバー (404) ───────────────────────────────────────────────

@pytest.mark.anyio
async def test_list_tasks_non_member(client: AsyncClient) -> None:
    """プロジェクト非メンバーはタスク一覧を取得できない。"""
    owner_token = await _register_and_token(client, "list-owner@example.com", "Owner")
    stranger_token = await _register_and_token(client, "list-stranger@example.com", "Stranger")
    project_id = await _create_project(client, owner_token, "Secret Project")

    resp = await client.get(
        f"/api/tasks/project/{project_id}",
        headers={"Authorization": f"Bearer {stranger_token}"},
    )
    assert resp.status_code == 404


@pytest.mark.anyio
async def test_create_task_non_member(client: AsyncClient) -> None:
    """プロジェクト非メンバーはタスクを作成できない。"""
    owner_token = await _register_and_token(client, "create-owner@example.com", "Owner")
    stranger_token = await _register_and_token(client, "create-stranger@example.com", "Stranger")
    project_id = await _create_project(client, owner_token, "Secret Project 2")

    resp = await client.post(
        f"/api/tasks/project/{project_id}",
        json={"title": "Injected task", "description": "", "status": "pending"},
        headers={"Authorization": f"Bearer {stranger_token}"},
    )
    assert resp.status_code == 404


@pytest.mark.anyio
async def test_get_task_non_member(client: AsyncClient) -> None:
    """プロジェクト非メンバーはタスク詳細を取得できない (task_id 経由)。"""
    owner_token = await _register_and_token(client, "get-owner@example.com", "Owner")
    stranger_token = await _register_and_token(client, "get-stranger@example.com", "Stranger")
    project_id = await _create_project(client, owner_token, "Secret Project 3")
    task_id = await _create_task(client, owner_token, project_id)

    resp = await client.get(
        f"/api/tasks/{task_id}",
        headers={"Authorization": f"Bearer {stranger_token}"},
    )
    assert resp.status_code == 404


@pytest.mark.anyio
async def test_update_task_non_member(client: AsyncClient) -> None:
    """プロジェクト非メンバーはタスクを更新できない (task_id 経由)。"""
    owner_token = await _register_and_token(client, "update-owner@example.com", "Owner")
    stranger_token = await _register_and_token(client, "update-stranger@example.com", "Stranger")
    project_id = await _create_project(client, owner_token, "Secret Project 4")
    task_id = await _create_task(client, owner_token, project_id)

    resp = await client.patch(
        f"/api/tasks/{task_id}",
        json={"status": "done"},
        headers={"Authorization": f"Bearer {stranger_token}"},
    )
    assert resp.status_code == 404


@pytest.mark.anyio
async def test_delete_task_non_member(client: AsyncClient) -> None:
    """プロジェクト非メンバーはタスクを削除できない (task_id 経由)。"""
    owner_token = await _register_and_token(client, "delete-owner@example.com", "Owner")
    stranger_token = await _register_and_token(client, "delete-stranger@example.com", "Stranger")
    project_id = await _create_project(client, owner_token, "Secret Project 5")
    task_id = await _create_task(client, owner_token, project_id)

    resp = await client.delete(
        f"/api/tasks/{task_id}",
        headers={"Authorization": f"Bearer {stranger_token}"},
    )
    assert resp.status_code == 404


# ── プロジェクトメンバー (正常系) ──────────────────────────────────────────────

@pytest.mark.anyio
async def test_member_can_crud_tasks(client: AsyncClient) -> None:
    """プロジェクトメンバーはタスクの CRUD が全て行える。"""
    token = await _register_and_token(client, "member-crud@example.com", "Member")
    headers = {"Authorization": f"Bearer {token}"}
    project_id = await _create_project(client, token, "CRUD Project")

    # CREATE
    create_resp = await client.post(
        f"/api/tasks/project/{project_id}",
        json={"title": "My task", "description": "desc", "status": "pending"},
        headers=headers,
    )
    assert create_resp.status_code == 201
    task = create_resp.json()
    task_id = task["id"]
    assert task["title"] == "My task"

    # LIST
    list_resp = await client.get(f"/api/tasks/project/{project_id}", headers=headers)
    assert list_resp.status_code == 200
    ids = [t["id"] for t in list_resp.json()]
    assert task_id in ids

    # GET
    get_resp = await client.get(f"/api/tasks/{task_id}", headers=headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == task_id

    # UPDATE
    update_resp = await client.patch(
        f"/api/tasks/{task_id}",
        json={"status": "in_progress"},
        headers=headers,
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["status"] == "in_progress"

    # DELETE
    delete_resp = await client.delete(f"/api/tasks/{task_id}", headers=headers)
    assert delete_resp.status_code == 204

    # 削除後は 404
    after_delete = await client.get(f"/api/tasks/{task_id}", headers=headers)
    assert after_delete.status_code == 404


# ── 既存テスト (認証ヘッダー付きに修正) ────────────────────────────────────────

@pytest.mark.anyio
async def test_update_task_status_returns_updated_task(client: AsyncClient) -> None:
    """タスクのステータス更新が正しい値を返すこと（認証ヘッダー付き）。"""
    token = await _register_and_token(client, "task-owner@example.com", "Task Owner")
    headers = {"Authorization": f"Bearer {token}"}

    project_resp = await client.post(
        "/api/projects/",
        json={"name": "Task status project", "description": "", "status": "active"},
        headers=headers,
    )
    project_id = project_resp.json()["id"]

    task_resp = await client.post(
        f"/api/tasks/project/{project_id}",
        json={"title": "Move through kanban", "description": "", "status": "pending"},
        headers=headers,
    )
    assert task_resp.status_code == 201
    task_id = task_resp.json()["id"]

    update_resp = await client.patch(
        f"/api/tasks/{task_id}",
        json={"status": "in_progress"},
        headers=headers,
    )

    assert update_resp.status_code == 200
    body = update_resp.json()
    assert body["id"] == task_id
    assert body["status"] == "in_progress"
    assert body["updated_at"]
