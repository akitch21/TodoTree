# ToDoTree

階層タスク管理アプリのポートフォリオ実装です。React + FastAPI + PostgreSQL で構築しています。

このアプリはまだデプロイ前です。現在はローカル開発環境での起動と、本番公開に向けた準備を進めている段階です。

---

## 概要

ToDoTree は「プロジェクト -> タスク -> サブタスク」という木構造でタスクを管理するアプリです。カンバン・ツリービュー・テーブルビューを切り替えながら作業でき、個人タスクもプロジェクトとは独立して管理できます。

---

## 技術スタック

**フロントエンド**
- React 19 + TypeScript
- Vite / Tailwind CSS v4
- shadcn/ui (Radix UI ベース)
- React Flow
- Axios

**バックエンド**
- FastAPI (Python 3.12)
- SQLAlchemy 2.0 async + asyncpg
- Alembic
- PostgreSQL 16
- python-jose / bcrypt

**ローカルインフラ**
- Docker Compose (PostgreSQL のみ)

---

## ローカルセットアップ

### 前提条件

- Docker & Docker Compose
- Node.js 20+
- Python 3.12+

### 1. リポジトリを取得

```bash
git clone <repo-url>
cd Learning-Log/projects/Todo-App
```

### 2. PostgreSQL を起動

`backend/docker-compose.yml` は PostgreSQL のみを起動します。FastAPI は Docker Compose では起動しません。

```bash
cd backend
cp .env.example .env
docker-compose up -d
```

デフォルトでは PostgreSQL はホスト側 `localhost:5433` で起動します。

### 3. バックエンドを起動

初回は依存関係をインストールします。

```bash
cd backend
pip install -e ".[dev]"
alembic upgrade head
uvicorn app.main:app --reload
```

API は `http://localhost:8000` で利用できます。Swagger UI は `http://localhost:8000/docs` です。

### 4. フロントエンドを起動

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

ブラウザで `http://localhost:5173` を開いてください。

---

## デモ動画の録画

Playwright でローカル起動中のアプリを操作し、デモ動画を生成できます。事前に backend (`http://localhost:8000`) と frontend (`http://localhost:5173`) を起動してください。

初回だけデモ用の環境変数ファイルを作成します。

```bash
cd frontend
cp .env.demo.example .env.demo
```

必要に応じて `.env.demo` のログイン情報を変更してください。スクリプトは録画前にデモユーザーを API で作成します。既に同じメールアドレスのユーザーが存在する場合は、そのユーザーでログインします。

```bash
cd frontend
npm install
npm run demo:record
```

動画は次に保存されます。

```text
frontend/demo/videos/todotree-demo.webm
```

`.env.demo` を使わず、環境変数で渡すこともできます。

| 変数名 | デフォルト | 説明 |
|---|---|---|
| `DEMO_APP_URL` | `http://localhost:5173` | フロントエンド URL |
| `DEMO_API_URL` | `http://localhost:8000` | API URL |
| `DEMO_USER_NAME` | `Demo User` | デモユーザー名 |
| `DEMO_USER_EMAIL` | `demo@example.com` | デモユーザーのメールアドレス |
| `DEMO_USER_PASSWORD` | `demo1234` | デモユーザーのパスワード |
| `DEMO_PROJECT_NAME` | 自動生成 | 録画時に作るプロジェクト名 |
| `DEMO_TASK_TITLE` | `デプロイ前チェックを完了する` | 録画時に作るタスク名 |

---

## 環境変数

### バックエンド (`backend/.env`)

| 変数名 | 例 | 説明 |
|---|---|---|
| `APP_ENV` | `development` | `production` / `prod` の場合、弱い `SECRET_KEY` では起動エラーになります |
| `DATABASE_URL` | `postgresql+asyncpg://todotree:todotree@localhost:5433/todotree` | asyncpg 用の PostgreSQL 接続文字列 |
| `SECRET_KEY` | `openssl rand -hex 32` などで生成 | JWT 署名用シークレット。本番では必ず強い値を設定してください |
| `ALGORITHM` | `HS256` | JWT アルゴリズム |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | アクセストークン有効期限 |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | CORS 許可オリジン。本番では Vercel の URL に変更します |
| `SQL_ECHO` | `false` | SQLAlchemy の SQL ログ出力 |
| `CREATE_TABLES_ON_STARTUP` | `false` | 開発用の `create_all` フォールバック。本番では `false` のまま Alembic を使います |

### フロントエンド (`frontend/.env`)

| 変数名 | 例 | 説明 |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` | FastAPI のベース URL |

Vercel にデプロイする場合は、Vercel の Environment Variables に `VITE_API_BASE_URL=https://your-api.example.com` を設定してください。

---

## DB マイグレーション

スキーマ管理は Alembic を使います。`app/main.py` の `Base.metadata.create_all` は本番用途では使わず、必要な場合だけ `CREATE_TABLES_ON_STARTUP=true` で開発用に有効化できます。

よく使うコマンド:

```bash
cd backend
alembic upgrade head
alembic revision --autogenerate -m "describe change"
```

モデルを変更したら、生成された migration を確認してからコミットしてください。

以前の `create_all` で作られたローカルテーブルが残っている場合、初回の `alembic upgrade head` で既存テーブルと重複することがあります。ローカルデータを消してよい開発環境では、`docker-compose down -v` で PostgreSQL volume を削除してから `docker-compose up -d` と `alembic upgrade head` をやり直してください。

---

## デプロイ準備

まだ実際のデプロイは行っていません。

バックエンドを Railway / Render などで起動する場合のコマンド例:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

`backend/Procfile` も同じ用途で用意しています。デプロイ先では次を設定してください。

- `APP_ENV=production`
- 強い `SECRET_KEY`
- 本番 PostgreSQL の `DATABASE_URL`
- フロントエンドの公開 URL に合わせた `FRONTEND_ORIGIN`
- デプロイ時または起動前に `alembic upgrade head`

フロントエンドは Vercel を想定しています。Vercel 側では `VITE_API_BASE_URL` にバックエンドの公開 URL を設定してください。

---

## API ドキュメント

バックエンド起動後、次の URL で確認できます。

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## 現在の制限事項

- まだデプロイしていません
- Docker Compose は PostgreSQL のみを起動します。FastAPI とフロントエンドはローカルで個別起動します
- DB スキーマは Alembic migration の適用が必要です
- チームメンバー機能は UI 中心で、招待フローは未完成です
- 担当者設定、コメント、添付ファイル、通知、ドラッグ&ドロップは未実装または限定的です
- 本番向けの監視、ログ集約、メール送信、バックアップ設定は未整備です

---

## 今後の実装予定

- Railway / Render などへの FastAPI デプロイ
- Vercel へのフロントエンドデプロイ
- 本番 PostgreSQL と Alembic 運用の確認
- メンバー招待・権限管理の実装
- タスクへのコメント・添付ファイル
- 期日リマインダー
