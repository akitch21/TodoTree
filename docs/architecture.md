# Architecture

## System Overview

TodoTree は React + Vite の SPA、FastAPI の REST API、PostgreSQL で構成されています。

```mermaid
flowchart LR
    User["User Browser"] --> Vercel["Frontend: React/Vite on Vercel"]
    Vercel -->|HTTPS REST API / Authorization Bearer token| RailwayAPI["Backend: FastAPI on Railway"]
    RailwayAPI -->|async SQLAlchemy| RailwayDB["PostgreSQL on Railway"]
    RailwayAPI -->|Alembic| RailwayDB
```

## Responsibilities

### Frontend

- React Router による画面遷移
- 認証トークンを `localStorage` に保存
- Axios interceptor で `Authorization: Bearer <token>` を付与
- `VITE_API_BASE_URL` を使ってBackendへ通信
- Vercel では `frontend/vercel.json` により全パスを `index.html` に rewrite

### Backend

- FastAPI による REST API
- JWT発行、認証ユーザー取得
- プロジェクト、タスク、個人タスク、招待のCRUD
- SQLAlchemy async session によるDBアクセス
- `/api/health` によるヘルスチェック
- `/api/` レスポンスに `Cache-Control: no-store` を付与

### Database

- PostgreSQL
- Alembic migration で schema を管理
- 本番では起動時の `create_all` を使わない

### Deploy

- Frontend: Vercel
- Backend: Railway
- Database: Railway PostgreSQL

## Authentication

```mermaid
sequenceDiagram
    actor U as User
    participant FE as Frontend
    participant API as FastAPI
    participant DB as PostgreSQL

    U->>FE: email/password
    FE->>API: POST /api/auth/login
    API->>DB: users lookup
    DB-->>API: user
    API-->>FE: access_token + user
    FE->>FE: save token/user to localStorage
    FE->>API: API request with Bearer token
```

## CORS

Backend は `FRONTEND_ORIGIN` を `allow_origins` に設定します。credentials は許可されています。

## Environment Variables

Backend:

- `DATABASE_URL`
- `SECRET_KEY`
- `FRONTEND_ORIGIN`
- `APP_ENV`
- `SQL_ECHO`
- `CREATE_TABLES_ON_STARTUP`

Frontend:

- `VITE_API_BASE_URL`

本番では `SECRET_KEY`, `DATABASE_URL`, `FRONTEND_ORIGIN` が production 用に設定されていない場合、Backend は起動しません。
