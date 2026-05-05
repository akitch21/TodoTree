from httpx import AsyncClient


async def test_update_task_status_returns_updated_task(client: AsyncClient) -> None:
    project_response = await client.post(
        "/api/projects/",
        json={"name": "Task status project", "description": "", "status": "active"},
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
