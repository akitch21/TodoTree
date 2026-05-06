# ToDoTree

階層構造でタスクを管理できるフルスタックWebアプリです。
フロントエンドは Vercel、バックエンドと PostgreSQL は Railway へのデプロイを想定しています。

## Tech Stack

- Frontend: React, TypeScript, Vite
- Backend: FastAPI, async SQLAlchemy
- Database: PostgreSQL
- Migration: Alembic

## Design Docs

設計書は [docs/README.md](./docs/README.md) から参照できます。

設計変更、API変更、DB変更、デプロイ手順変更を行う場合は、コード変更と同じ PR で docs も更新します。

## Local Setup

### Backend

```bash
cd backend
cp .env.example .env
```

ローカル開発では `.env` を次のように設定します。

```text
APP_ENV=development
DATABASE_URL=postgresql+asyncpg://todotree:todotree@localhost:5433/todotree
SECRET_KEY=local-development-secret
FRONTEND_ORIGIN=http://localhost:5173
SQL_ECHO=false
CREATE_TABLES_ON_STARTUP=false
```

PostgreSQL を起動して migration を適用します。

```bash
docker-compose up -d
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

Health check:

```bash
curl http://localhost:8000/api/health
```

### Frontend

```bash
cd frontend
cp .env.example .env
```

ローカル開発では `.env` を次のように設定します。

```text
VITE_API_BASE_URL=http://localhost:8000
```

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

Vite の出力ディレクトリは `dist` です。

## Railway Backend Deploy

Railway の backend service は `backend` ディレクトリを root として設定します。

Start command は `Procfile` の内容を使います。

```text
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Railway backend に設定する環境変数:

```text
DATABASE_URL=<Railway PostgreSQL DATABASE_URL>
SECRET_KEY=<strong-random-secret>
FRONTEND_ORIGIN=https://<your-vercel-app>.vercel.app
APP_ENV=production
```

Railway の `DATABASE_URL` が `postgresql://` または `postgres://` の場合でも、アプリ側で `postgresql+asyncpg://` に正規化します。

Migration:

```bash
railway run alembic upgrade head
```

本番では起動時の自動テーブル作成は使いません。schema 変更は Alembic migration で管理します。

## Vercel Frontend Deploy

Vercel の frontend project は `frontend` ディレクトリを root として設定します。

- Build command: `npm run build`
- Output directory: `dist`

Vercel に設定する環境変数:

```text
VITE_API_BASE_URL=https://<your-railway-api>.railway.app
```

## Environment Examples

### backend/.env.example

```text
DATABASE_URL=
SECRET_KEY=
FRONTEND_ORIGIN=
APP_ENV=production
```

### frontend/.env.example

```text
VITE_API_BASE_URL=
```

## Deployment Checklist

1. Railway PostgreSQL を作成する
2. Railway backend service を `backend` root で作成する
3. Railway backend に環境変数を設定する
4. Railway で `alembic upgrade head` を実行する
5. Vercel frontend project を `frontend` root で作成する
6. Vercel に `VITE_API_BASE_URL` を設定する
7. Vercel にデプロイする
8. Railway backend の `FRONTEND_ORIGIN` を Vercel の本番URLに合わせる

## Basic Flow

デプロイ後に以下を確認します。

- `GET /api/health` が `{ "status": "ok" }` を返す
- ユーザー登録
- ログイン
- プロジェクト作成
- メールアドレスでユーザー招待
- 招待されたユーザーが `/projects` で承認

## Notes

- `SECRET_KEY` は production で必須です。弱い値や未設定では起動しません。
- `FRONTEND_ORIGIN` は production で Vercel のURLを設定してください。
- API レスポンスには `Cache-Control: no-store` を付け、認証付きデータがキャッシュされにくいようにしています。
