from httpx import AsyncClient


async def test_register_login_and_me(client: AsyncClient) -> None:
    register_response = await client.post(
        "/api/auth/register",
        json={
            "name": "Test User",
            "email": "test@example.com",
            "password": "password123",
        },
    )

    assert register_response.status_code == 201
    register_body = register_response.json()
    assert register_body["token_type"] == "bearer"
    assert register_body["access_token"]
    assert register_body["user"]["email"] == "test@example.com"

    login_response = await client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "password123"},
    )

    assert login_response.status_code == 200
    login_body = login_response.json()
    assert login_body["access_token"]

    me_response = await client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {login_body['access_token']}"},
    )

    assert me_response.status_code == 200
    assert me_response.json()["email"] == "test@example.com"


async def test_register_rejects_duplicate_email(client: AsyncClient) -> None:
    payload = {
        "name": "Test User",
        "email": "duplicate@example.com",
        "password": "password123",
    }

    first_response = await client.post("/api/auth/register", json=payload)
    second_response = await client.post("/api/auth/register", json=payload)

    assert first_response.status_code == 201
    assert second_response.status_code == 409
