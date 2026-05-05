from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.models.project import Project, ProjectInvitation, ProjectMember
from app.models.user import User


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


async def test_delete_me_requires_matching_email(client: AsyncClient) -> None:
    register_response = await client.post(
        "/api/auth/register",
        json={
            "name": "Delete User",
            "email": "delete-mismatch@example.com",
            "password": "password123",
        },
    )
    token = register_response.json()["access_token"]

    delete_response = await client.request(
        "DELETE",
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
        json={"email": "wrong@example.com"},
    )

    assert delete_response.status_code == 400


async def test_delete_me_removes_user_email_and_transfers_or_deletes_projects(
    client: AsyncClient,
    test_engine,
) -> None:
    owner_response = await client.post(
        "/api/auth/register",
        json={
            "name": "Leaving Owner",
            "email": "leaving-owner@example.com",
            "password": "password123",
        },
    )
    member_response = await client.post(
        "/api/auth/register",
        json={
            "name": "Remaining Admin",
            "email": "remaining-admin@example.com",
            "password": "password123",
        },
    )
    inviter_response = await client.post(
        "/api/auth/register",
        json={
            "name": "External Inviter",
            "email": "external-inviter@example.com",
            "password": "password123",
        },
    )
    owner = owner_response.json()
    member = member_response.json()
    inviter = inviter_response.json()
    owner_headers = {"Authorization": f"Bearer {owner['access_token']}"}
    inviter_headers = {"Authorization": f"Bearer {inviter['access_token']}"}

    solo_project_response = await client.post(
        "/api/projects/",
        headers=owner_headers,
        json={"name": "Solo Project", "description": "", "status": "active"},
    )
    shared_project_response = await client.post(
        "/api/projects/",
        headers=owner_headers,
        json={"name": "Shared Project", "description": "", "status": "active"},
    )
    solo_project_id = solo_project_response.json()["id"]
    shared_project_id = shared_project_response.json()["id"]

    add_member_response = await client.post(
        f"/api/projects/{shared_project_id}/members",
        headers=owner_headers,
        json={"user_id": member["user"]["id"], "role": "admin"},
    )
    assert add_member_response.status_code == 201

    invitation_response = await client.post(
        f"/api/projects/{shared_project_id}/invitations",
        headers=owner_headers,
        json={"email": "pending-delete@example.com", "role": "member"},
    )
    assert invitation_response.status_code == 201

    inviter_project_response = await client.post(
        "/api/projects/",
        headers=inviter_headers,
        json={"name": "External Project", "description": "", "status": "active"},
    )
    invited_to_leaving_response = await client.post(
        f"/api/projects/{inviter_project_response.json()['id']}/invitations",
        headers=inviter_headers,
        json={"email": "leaving-owner@example.com", "role": "member"},
    )
    assert invited_to_leaving_response.status_code == 201

    delete_response = await client.request(
        "DELETE",
        "/api/auth/me",
        headers=owner_headers,
        json={"email": "leaving-owner@example.com"},
    )
    assert delete_response.status_code == 204

    Session = async_sessionmaker(test_engine, expire_on_commit=False)
    async with Session() as session:
        deleted_user = await session.scalar(
            select(User).where(User.email == "leaving-owner@example.com")
        )
        solo_project = await session.scalar(select(Project).where(Project.id == solo_project_id))
        shared_owner = await session.scalar(
            select(ProjectMember).where(
                ProjectMember.project_id == shared_project_id,
                ProjectMember.user_id == member["user"]["id"],
            )
        )
        remaining_invitation = await session.scalar(
            select(ProjectInvitation).where(
                (ProjectInvitation.email == "leaving-owner@example.com")
                | (ProjectInvitation.invited_by_user_id == owner["user"]["id"])
            )
        )

    assert deleted_user is None
    assert solo_project is None
    assert shared_owner is not None
    assert shared_owner.role == "owner"
    assert remaining_invitation is None
