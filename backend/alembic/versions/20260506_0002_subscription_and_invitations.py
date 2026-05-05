"""subscription fields, project_member updates, project_invitations table

Revision ID: 20260506_0002
Revises: 20260505_0001
Create Date: 2026-05-06
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "20260506_0002"
down_revision: str | None = "20260505_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ── 1. users: add subscription / plan columns ──────────────────────────────
    op.add_column("users", sa.Column("plan", sa.String(length=20), nullable=False, server_default="free"))
    op.add_column("users", sa.Column("subscription_status", sa.String(length=20), nullable=False, server_default="inactive"))
    op.add_column("users", sa.Column("stripe_customer_id", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("stripe_subscription_id", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("current_period_end", sa.DateTime(timezone=True), nullable=True))

    op.create_index("ix_users_stripe_customer_id", "users", ["stripe_customer_id"], unique=True)
    op.create_index("ix_users_stripe_subscription_id", "users", ["stripe_subscription_id"], unique=True)

    # ── 2. project_members: add created_at + unique constraint ─────────────────
    op.add_column(
        "project_members",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    # Index on project_id and user_id individually (already have composite via UniqueConstraint)
    op.create_index("ix_project_members_project_id", "project_members", ["project_id"], unique=False)
    op.create_index("ix_project_members_user_id", "project_members", ["user_id"], unique=False)
    op.create_unique_constraint("uq_project_member", "project_members", ["project_id", "user_id"])

    # ── 3. project_invitations table ───────────────────────────────────────────
    op.create_table(
        "project_invitations",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("project_id", sa.UUID(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False, server_default="member"),
        sa.Column("token", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("invited_by_user_id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["invited_by_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_project_invitations_project_id", "project_invitations", ["project_id"], unique=False)
    op.create_index("ix_project_invitations_email", "project_invitations", ["email"], unique=False)
    op.create_index("ix_project_invitations_invited_by_user_id", "project_invitations", ["invited_by_user_id"], unique=False)
    op.create_index("ix_project_invitations_token", "project_invitations", ["token"], unique=True)

    # Partial unique index: only one pending invitation per (project_id, email)
    op.execute(
        "CREATE UNIQUE INDEX uq_pending_invitation "
        "ON project_invitations (project_id, email) "
        "WHERE status = 'pending'"
    )


def downgrade() -> None:
    # ── 3. drop project_invitations ────────────────────────────────────────────
    op.execute("DROP INDEX IF EXISTS uq_pending_invitation")
    op.drop_index("ix_project_invitations_token", table_name="project_invitations")
    op.drop_index("ix_project_invitations_invited_by_user_id", table_name="project_invitations")
    op.drop_index("ix_project_invitations_email", table_name="project_invitations")
    op.drop_index("ix_project_invitations_project_id", table_name="project_invitations")
    op.drop_table("project_invitations")

    # ── 2. revert project_members ──────────────────────────────────────────────
    op.drop_constraint("uq_project_member", "project_members", type_="unique")
    op.drop_index("ix_project_members_user_id", table_name="project_members")
    op.drop_index("ix_project_members_project_id", table_name="project_members")
    op.drop_column("project_members", "created_at")

    # ── 1. revert users ────────────────────────────────────────────────────────
    op.drop_index("ix_users_stripe_subscription_id", table_name="users")
    op.drop_index("ix_users_stripe_customer_id", table_name="users")
    op.drop_column("users", "current_period_end")
    op.drop_column("users", "stripe_subscription_id")
    op.drop_column("users", "stripe_customer_id")
    op.drop_column("users", "subscription_status")
    op.drop_column("users", "plan")
