import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(String(2000), default="")
    status: Mapped[str] = mapped_column(String(20), default="active")  # active | completed | archived
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # root tasks のみ (parent_id IS NULL)。children は tasks ルーターで selectinload する
    tasks: Mapped[list["Task"]] = relationship(  # type: ignore[name-defined]
        "Task",
        primaryjoin="and_(foreign(Task.project_id) == Project.id, Task.parent_id == None)",
        cascade="all, delete-orphan",
        lazy="raise",
        viewonly=False,
    )
    members: Mapped[list["ProjectMember"]] = relationship(
        "ProjectMember", back_populates="project", cascade="all, delete-orphan", lazy="raise"
    )


class ProjectMember(Base):
    __tablename__ = "project_members"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"))
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    role: Mapped[str] = mapped_column(String(20), default="member")  # owner | member

    project: Mapped["Project"] = relationship("Project", back_populates="members", lazy="raise")
    user: Mapped["User"] = relationship("User", back_populates="project_memberships", lazy="raise")  # type: ignore[name-defined]
