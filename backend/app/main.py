from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
import app.models  # noqa: F401 - Alembic / optional dev table creation metadata
from app.routers import auth, personal_tasks, projects, tasks


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.create_tables_on_startup:
        # Development fallback only. Production schema changes are managed by Alembic.
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="ToDoTree API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,           prefix="/api/auth",           tags=["auth"])
app.include_router(projects.router,      prefix="/api/projects",        tags=["projects"])
app.include_router(tasks.router,         prefix="/api/tasks",           tags=["tasks"])
app.include_router(personal_tasks.router, prefix="/api/personal-tasks", tags=["personal-tasks"])


@app.get("/api/health")
async def health():
    return {"status": "ok"}
