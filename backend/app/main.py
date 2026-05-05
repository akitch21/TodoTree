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

# NOTE: Starlette applies add_middleware() in reverse insertion order (last added = outermost).
# @app.middleware("http") also calls add_middleware() internally.
# To ensure CORSMiddleware is outermost (handles OPTIONS preflight first),
# it must be added AFTER any @app.middleware("http") decorators.

@app.middleware("http")
async def add_no_store_headers(request: Request, call_next):
    response: Response = await call_next(request)
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store"
        response.headers["Pragma"] = "no-cache"
    return response


# 開発環境では localhost の複数ポートを許可（Vite が 5173/5174 を自動選択するため）
_dev_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
]
_allowed_origins = list({settings.frontend_origin} | set(_dev_origins)) \
    if settings.app_env != "production" else [settings.frontend_origin]
if settings.extra_origins:
    _allowed_origins += [o.strip() for o in settings.extra_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,                    prefix="/api/auth",           tags=["auth"])
app.include_router(projects.router,                prefix="/api/projects",        tags=["projects"])
app.include_router(project_invitations_router,     prefix="/api/projects",        tags=["invitations"])
app.include_router(invitations_router,             prefix="/api/invitations",     tags=["invitations"])
app.include_router(tasks.router,                   prefix="/api/tasks",           tags=["tasks"])
app.include_router(personal_tasks.router,          prefix="/api/personal-tasks",  tags=["personal-tasks"])


@app.get("/api/health")
async def health():
    return {"status": "ok"}
