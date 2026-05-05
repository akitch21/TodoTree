from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
import app.models  # noqa: F401 - Alembic / optional dev table creation metadata
from app.routers import auth, personal_tasks, projects, tasks
from app.routers.invitations import invitations_router, project_invitations_router


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


@app.middleware("http")
async def add_no_store_headers(request: Request, call_next):
    response: Response = await call_next(request)
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store"
        response.headers["Pragma"] = "no-cache"
    return response

app.include_router(auth.router,                    prefix="/api/auth",           tags=["auth"])
app.include_router(projects.router,                prefix="/api/projects",        tags=["projects"])
app.include_router(project_invitations_router,     prefix="/api/projects",        tags=["invitations"])
app.include_router(invitations_router,             prefix="/api/invitations",     tags=["invitations"])
app.include_router(tasks.router,                   prefix="/api/tasks",           tags=["tasks"])
app.include_router(personal_tasks.router,          prefix="/api/personal-tasks",  tags=["personal-tasks"])


@app.get("/api/health")
async def health():
    return {"status": "ok"}
