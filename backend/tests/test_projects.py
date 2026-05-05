from httpx import AsyncClient


async def test_project_crud(client: AsyncClient) -> None:
    create_response = await client.post(
        "/api/projects/",
        json={
            "name": "Launch checklist",
            "description": "Deployment preparation",
            "status": "active",
        },
    )

    assert create_response.status_code == 201
    created = create_response.json()
    assert created["name"] == "Launch checklist"
    assert created["tasks"] == []
    assert created["members"] == []

    project_id = created["id"]

    list_response = await client.get("/api/projects/")
    assert list_response.status_code == 200
    assert [project["id"] for project in list_response.json()] == [project_id]

    update_response = await client.patch(
        f"/api/projects/{project_id}",
        json={"name": "Production checklist", "status": "completed"},
    )
    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["name"] == "Production checklist"
    assert updated["status"] == "completed"

    get_response = await client.get(f"/api/projects/{project_id}")
    assert get_response.status_code == 200
    assert get_response.json()["id"] == project_id

    delete_response = await client.delete(f"/api/projects/{project_id}")
    assert delete_response.status_code == 204

    missing_response = await client.get(f"/api/projects/{project_id}")
    assert missing_response.status_code == 404
