import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    avatar: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # ── Subscription / plan ────────────────────────────────────────────────────
    # plan: "free" | "pro"
    plan: Mapped[str] = mapped_column(String(20), default="free", server_default="free")
    # subscription_status: "inactive" | "active" | "canceled" | "past_due"
    subscription_status: Mapped[str] = mapped_column(
        String(20), default="inactive", server_default="inactive"
    )
    # Stripe integration (populated via Webhook once Stripe is enabled)
    stripe_customer_id: Mapped[str | None] = mapped_column(
        String(255), unique=True, nullable=True
    )
    stripe_subscription_id: Mapped[str | None] = mapped_column(
        String(255), unique=True, nullable=True
    )
    current_period_end: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # relationships
    project_memberships: Mapped[list["ProjectMember"]] = relationship(  # type: ignore[name-defined]
        "ProjectMember", back_populates="user"
    )
