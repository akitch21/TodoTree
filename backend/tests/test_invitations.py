"""
Invitation feature tests.

Covers:
- free plan allows up to 4 seats (members + pending invitations)
- free plan rejects the 5th seat with 403
- pending invitations count toward the seat limit
- cannot invite an existing member
- cannot create a duplicate pending invitation
- only owner/admin can invite
- accepting a token creates a ProjectMember
- wrong-email user cannot accept
- expired invitation cannot be accepted
"""

from datetime import datetime, timedelta, timezone

from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.models.project import ProjectInvitation, ProjectMember


# ── Helpers ────────────────────────────────────────────────────────────────────

async def _register(client: AsyncClient, email: str, name: str = "User") -> dict:
    """Register a user and return {"token": ..., "user_id": ...}."""
    resp = await client.post(
        "/api/auth/register",
        json={"name": name, "email": email, "password": "password123"},
    )
    assert resp.status_code == 201, resp.text
    data = resp.json()
    return {"token": data["access_token"], "user_id": data["user"]["id"]}


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def _create_project(client: AsyncClient, token: str, name: str = "Test Project") -> str:
    """Create a project and return its ID."""
    resp = await client.post(
        "/api/projects/",
        json={"name": name, "description": "", "status": "active"},
        headers=_auth(token),
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


async def _invite(
    client: AsyncClient,
    token: str,
    project_id: str,
    email: str,
    role: str = "member",
):
    """Send an invitation and return the HTTP response."""
    return await client.post(
        f"/api/projects/{project_id}/invitations",
        json={"email": email, "role": role},
        headers=_auth(token),
    )


# ── Tests ──────────────────────────────────────────────────────────────────────

async def test_free_plan_allows_up_to_4_seats(client: AsyncClient) -> None:
    """Owner (seat 1) + 3 pending invitations = 4 total: all succeed."""
    owner = await _register(client, "owner_4@example.com")
    project_id = await _create_project(client, owner["token"])

    for i in range(3):
        resp = await _invite(client, owner["token"], project_id, f"invite4_{i}@example.com")
        assert resp.status_code == 201, f"seat {i + 2} should succeed: {resp.text}"


async def test_free_plan_rejects_5th_seat(client: AsyncClient) -> None:
    """4 seats already occupied -> 5th invite must return 403."""
    owner = await _register(client, "owner_5@example.com")
    project_id = await _create_project(client, owner["token"])

    for i in range(3):
        resp = await _invite(client, owner["token"], project_id, f"seat5_{i}@example.com")
        assert resp.status_code == 201

    resp = await _invite(client, owner["token"], project_id, "fifth@example.com")
    assert resp.status_code == 403


async def test_pending_invitations_count_toward_limit(client: AsyncClient) -> None:
    """Pending (not yet accepted) invitations still occupy seats."""
    owner = await _register(client, "owner_pending@example.com")
    project_id = await _create_project(client, owner["token"])

    for i in range(3):
        resp = await _invite(client, owner["token"], project_id, f"pend_{i}@example.com")
        assert resp.status_code == 201

    # owner + 3 pending = 4 seats; next invite must be blocked
    resp = await _invite(client, owner["token"], project_id, "overflow@example.com")
    assert resp.status_code == 403


async def test_cannot_invite_existing_member(client: AsyncClient) -> None:
    """Inviting a user who is already a member returns 400."""
    owner = await _register(client, "owner_dup_mem@example.com")
    member_user = await _register(client, "existing_mem@example.com")
    project_id = await _create_project(client, owner["token"])

    add_resp = await client.post(
        f"/api/projects/{project_id}/members",
        json={"user_id": member_user["user_id"], "role": "member"},
        headers=_auth(owner["token"]),
    )
    assert add_resp.status_code == 201

    resp = await _invite(client, owner["token"], project_id, "existing_mem@example.com")
    assert resp.status_code == 400


async def test_cannot_create_duplicate_pending_invitation(client: AsyncClient) -> None:
    """A second pending invite to the same email returns 400."""
    owner = await _register(client, "owner_dup_inv@example.com")
    project_id = await _create_project(client, owner["token"])

    resp1 = await _invite(client, owner["token"], project_id, "dup@example.com")
    assert resp1.status_code == 201

    resp2 = await _invite(client, owner["token"], project_id, "dup@example.com")
    assert resp2.status_code == 400


async def test_only_owner_or_admin_can_invite(client: AsyncClient) -> None:
    """A plain 'member' cannot create invitations."""
    owner = await _register(client, "owner_rbac@example.com")
    plain = await _register(client, "plain_rbac@example.com")
    project_id = await _create_project(client, owner["token"])

    await client.post(
        f"/api/projects/{project_id}/members",
        json={"user_id": plain["user_id"], "role": "member"},
        headers=_auth(owner["token"]),
    )

    resp = await _invite(client, plain["token"], project_id, "outsider@example.com")
    assert resp.status_code == 403


async def test_non_member_cannot_invite(client: AsyncClient) -> None:
    """A user not in the project cannot create invitations."""
    owner = await _register(client, "owner_stranger@example.com")
    stranger = await _register(client, "stranger@example.com")
    project_id = await _create_project(client, owner["token"])

    resp = await _invite(client, stranger["token"], project_id, "target@example.com")
    assert resp.status_code == 403


async def test_accept_invitation_creates_project_member(
    client: AsyncClient, test_engine
) -> None:
    """Accepting a valid token creates a ProjectMember row in the database."""
    owner = await _register(client, "owner_accept@example.com")
    invitee = await _register(client, "invitee_accept@example.com")
    project_id = await _create_project(client, owner["token"])

    invite_resp = await _invite(client, owner["token"], project_id, "invitee_accept@example.com")
    assert invite_resp.status_code == 201
    inv_token = invite_resp.json()["token"]

    accept_resp = await client.post(
        f"/api/invitations/{inv_token}/accept",
        headers=_auth(invitee["token"]),
    )
    assert accept_resp.status_code == 200
    assert accept_resp.json()["status"] == "accepted"

    # Verify the ProjectMember row exists in the DB
    Session = async_sessionmaker(test_engine, expire_on_commit=False)
    async with Session() as session:
        result = await session.execute(
            select(ProjectMember).where(
                ProjectMember.project_id == project_id,
                ProjectMember.user_id == invitee["user_id"],
            )
        )
        member = result.scalar_one_or_none()
        assert member is not None
        assert member.role == "member"


async def test_invited_user_can_list_and_accept_own_pending_invitation(
    client: AsyncClient,
) -> None:
    """The invited user gets an in-app pending invitation and can accept it."""
    owner = await _register(client, "owner_my_inv@example.com")
    invitee = await _register(client, "invitee_my_inv@example.com")
    project_id = await _create_project(client, owner["token"], "Visible Invite Project")

    invite_resp = await _invite(client, owner["token"], project_id, "invitee_my_inv@example.com")
    assert invite_resp.status_code == 201

    list_resp = await client.get(
        "/api/invitations/me",
        headers=_auth(invitee["token"]),
    )
    assert list_resp.status_code == 200
    invitations = list_resp.json()
    assert len(invitations) == 1
    assert invitations[0]["project_id"] == project_id
    assert invitations[0]["project_name"] == "Visible Invite Project"
    assert invitations[0]["status"] == "pending"

    accept_resp = await client.post(
        f"/api/invitations/{invitations[0]['token']}/accept",
        headers=_auth(invitee["token"]),
    )
    assert accept_resp.status_code == 200

    projects_resp = await client.get(
        "/api/projects/",
        headers=_auth(invitee["token"]),
    )
    assert projects_resp.status_code == 200
    assert [project["id"] for project in projects_resp.json()] == [project_id]


async def test_wrong_email_cannot_accept_invitation(client: AsyncClient) -> None:
    """A user whose email does not match the invitation email gets 403."""
    owner = await _register(client, "owner_mismatch@example.com")
    invitee = await _register(client, "invitee_mismatch@example.com")
    wrong = await _register(client, "wrong_mismatch@example.com")
    project_id = await _create_project(client, owner["token"])

    invite_resp = await _invite(client, owner["token"], project_id, "invitee_mismatch@example.com")
    inv_token = invite_resp.json()["token"]

    resp = await client.post(
        f"/api/invitations/{inv_token}/accept",
        headers=_auth(wrong["token"]),
    )
    assert resp.status_code == 403


async def test_expired_invitation_cannot_be_accepted(
    client: AsyncClient, test_engine
) -> None:
    """An invitation whose expires_at is in the past returns 400."""
    owner = await _register(client, "owner_expired@example.com")
    invitee = await _register(client, "invitee_expired@example.com")
    project_id = await _create_project(client, owner["token"])

    invite_resp = await _invite(client, owner["token"], project_id, "invitee_expired@example.com")
    inv_id = invite_resp.json()["id"]
    inv_token = invite_resp.json()["token"]

    # Backdate expires_at so the invitation is already expired
    Session = async_sessionmaker(test_engine, expire_on_commit=False)
    async with Session() as session:
        result = await session.execute(
            select(ProjectInvitation).where(ProjectInvitation.id == inv_id)
        )
        inv = result.scalar_one()
        inv.expires_at = datetime.now(timezone.utc) - timedelta(days=1)
        await session.commit()

    resp = await client.post(
        f"/api/invitations/{inv_token}/accept",
        headers=_auth(invitee["token"]),
    )
    assert resp.status_code == 400


async def test_list_invitations_requires_owner_or_admin(client: AsyncClient) -> None:
    """A plain member cannot list invitations; owner can."""
    owner = await _register(client, "owner_list@example.com")
    plain = await _register(client, "plain_list@example.com")
    project_id = await _create_project(client, owner["token"])

    await _invite(client, owner["token"], project_id, "a_list@example.com")
    await _invite(client, owner["token"], project_id, "b_list@example.com")

    # owner can list
    resp = await client.get(
        f"/api/projects/{project_id}/invitations",
        headers=_auth(owner["token"]),
    )
    assert resp.status_code == 200
    assert len(resp.json()) == 2

    # plain member cannot list
    await client.post(
        f"/api/projects/{project_id}/members",
        json={"user_id": plain["user_id"], "role": "member"},
        headers=_auth(owner["token"]),
    )
    resp = await client.get(
        f"/api/projects/{project_id}/invitations",
        headers=_auth(plain["token"]),
    )
    assert resp.status_code == 403


async def test_revoke_invitation(client: AsyncClient) -> None:
    """DELETE sets status to 'revoked'; subsequent listing confirms it."""
    owner = await _register(client, "owner_revoke@example.com")
    project_id = await _create_project(client, owner["token"])

    invite_resp = await _invite(client, owner["token"], project_id, "revoke_me@example.com")
    inv_id = invite_resp.json()["id"]

    del_resp = await client.delete(
        f"/api/projects/{project_id}/invitations/{inv_id}",
        headers=_auth(owner["token"]),
    )
    assert del_resp.status_code == 204

    list_resp = await client.get(
        f"/api/projects/{project_id}/invitations",
        headers=_auth(owner["token"]),
    )
    found = next((i for i in list_resp.json() if i["id"] == inv_id), None)
    assert found is not None
    assert found["status"] == "revoked"


async def test_invited_non_member_cannot_revoke_invitation(client: AsyncClient) -> None:
    """Invitation revoke is limited to project owner/admin members, not invitees."""
    owner = await _register(client, "owner_revoke_guard@example.com")
    invitee = await _register(client, "invitee_revoke_guard@example.com")
    project_id = await _create_project(client, owner["token"])

    invite_resp = await _invite(client, owner["token"], project_id, "invitee_revoke_guard@example.com")
    inv_id = invite_resp.json()["id"]

    del_resp = await client.delete(
        f"/api/projects/{project_id}/invitations/{inv_id}",
        headers=_auth(invitee["token"]),
    )
    assert del_resp.status_code == 403


async def test_admin_can_invite(client: AsyncClient) -> None:
    """An admin member can also send invitations."""
    owner = await _register(client, "owner_admin_inv@example.com")
    admin_user = await _register(client, "admin_inv@example.com")
    project_id = await _create_project(client, owner["token"])

    await client.post(
        f"/api/projects/{project_id}/members",
        json={"user_id": admin_user["user_id"], "role": "admin"},
        headers=_auth(owner["token"]),
    )

    resp = await _invite(client, admin_user["token"], project_id, "via_admin@example.com")
    assert resp.status_code == 201
