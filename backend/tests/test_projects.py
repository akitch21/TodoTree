from httpx import AsyncClient


async def _register_and_token(client: AsyncClient, email: str = "owner@example.com") -> str:
    """Helper: register a user and return JWT token."""
    resp = await client.post(
        "/api/auth/register",
        json={"name": "Test Owner", "email": email, "password": "password123"},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["access_token"]


async def test_project_crud(client: AsyncClient) -> None:
    token = await _register_and_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    create_response = await client.post(
        "/api/projects/",
        json={
            "name": "Launch checklist",
            "description": "Deployment preparation",
            "status": "active",
        },
        headers=headers,
    )

    assert create_response.status_code == 201
    created = create_response.json()
    assert created["name"] == "Launch checklist"
    # tasks フィールドは ProjectListItem には存在しない（task_count で集計）
    assert created["task_count"] == 0
    # creator is auto-added as owner member
    assert len(created["members"]) == 1
    assert created["members"][0]["role"] == "owner"

    project_id = created["id"]

    list_response = await client.get("/api/projects/", headers=headers)
    assert list_response.status_code == 200
    assert [project["id"] for project in list_response.json()] == [project_id]

    update_response = await client.patch(
        f"/api/projects/{project_id}",
        json={"name": "Production checklist", "status": "completed"},
        headers=headers,
    )
    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["name"] == "Production checklist"
    assert updated["status"] == "completed"

    get_response = await client.get(f"/api/projects/{project_id}", headers=headers)
    assert get_response.status_code == 200
    assert get_response.json()["id"] == project_id

    delete_response = await client.delete(f"/api/projects/{project_id}", headers=headers)
    assert delete_response.status_code == 204

    missing_response = await client.get(f"/api/projects/{project_id}", headers=headers)
    assert missing_response.status_code == 404


async def test_same_project_name_created_by_different_users_stays_separate(
    client: AsyncClient,
) -> None:
    first_token = await _register_and_token(client, "same-name-owner-1@example.com")
    second_token = await _register_and_token(client, "same-name-owner-2@example.com")
    first_headers = {"Authorization": f"Bearer {first_token}"}
    second_headers = {"Authorization": f"Bearer {second_token}"}

    first_create = await client.post(
        "/api/projects/",
        json={"name": "Shared Name", "description": "first", "status": "active"},
        headers=first_headers,
    )
    second_create = await client.post(
        "/api/projects/",
        json={"name": "Shared Name", "description": "second", "status": "active"},
        headers=second_headers,
    )

    assert first_create.status_code == 201
    assert second_create.status_code == 201
    first_project = first_create.json()
    second_project = second_create.json()
    assert first_project["id"] != second_project["id"]

    first_list = await client.get("/api/projects/", headers=first_headers)
    second_list = await client.get("/api/projects/", headers=second_headers)

    assert [project["id"] for project in first_list.json()] == [first_project["id"]]
    assert [project["id"] for project in second_list.json()] == [second_project["id"]]

    first_get_second = await client.get(
        f"/api/projects/{second_project['id']}",
        headers=first_headers,
    )
    second_get_first = await client.get(
        f"/api/projects/{first_project['id']}",
        headers=second_headers,
    )

    assert first_get_second.status_code == 404
    assert second_get_first.status_code == 404
