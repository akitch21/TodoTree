from httpx import AsyncClient


async def _register_and_token(client: AsyncClient) -> str:
    response = await client.post(
        "/api/auth/register",
        json={"name": "Task Owner", "email": "task-owner@example.com", "password": "password123"},
    )
    assert response.status_code == 201, response.text
    return response.json()["access_token"]


async def test_update_task_status_returns_updated_task(client: AsyncClient) -> None:
    token = await _register_and_token(client)
    headers = {"Authorization": f"Bearer {token}"}
    project_response = await client.post(
        "/api/projects/",
        json={"name": "Task status project", "description": "", "status": "active"},
        headers=headers,
    )
    project_id = project_response.json()["id"]

    task_response = await client.post(
        f"/api/tasks/project/{project_id}",
        json={"title": "Move through kanban", "description": "", "status": "pending"},
    )
    task_id = task_response.json()["id"]

    update_response = await client.patch(
        f"/api/tasks/{task_id}",
        json={"status": "in_progress"},
    )

    assert update_response.status_code == 200
    body = update_response.json()
    assert body["id"] == task_id
    assert body["status"] == "in_progress"
    assert body["updated_at"]
