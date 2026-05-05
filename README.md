# ToDoTree

階層構造でタスクを管理できるフルスタックWebアプリです。
プロジェクト単位でタスクをツリーとして整理し、個人タスクも同時に管理できます。

---

## 🔗 デモ

👉 https://your-app.vercel.app
👉 API: https://your-api.railway.app

**デモアカウント**

* Email: [demo@example.com](mailto:demo@example.com)
* Password: demo1234

---

## 🎥 デモ動画

<!-- GIF or 動画リンク -->

![demo](./docs/demo.gif)

---

## ✨ 主な機能

* ユーザー認証（JWT）
* プロジェクト管理（作成 / 編集 / ステータス変更）
* 階層タスク（親子構造）
* タスクCRUD（追加 / 編集 / 削除 / 完了）
* 個人タスク管理
* ツリービュー / テーブルビュー
* APIエラーハンドリング

---

## 🛠 技術スタック

### Frontend

* React + TypeScript
* Vite
* Tailwind CSS
* React Flow
* Axios

### Backend

* FastAPI
* SQLAlchemy (async)
* PostgreSQL
* Alembic

### Infrastructure

* Vercel（Frontend）
* Railway（Backend / DB）

---

## 🏗 アーキテクチャ

```text
Frontend (Vercel)
   ↓ REST API
Backend (FastAPI / Railway)
   ↓
PostgreSQL
```

---

## 🚀 セットアップ（ローカル）

### 1. クローン

```bash
git clone https://github.com/yourname/todotree
cd todotree
```

### 2. DB起動

```bash
cd backend
cp .env.example .env
docker-compose up -d
```

### 3. Backend起動

```bash
pip install -e ".[dev]"
alembic upgrade head
uvicorn app.main:app --reload
```

### 4. Frontend起動

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

---

## ⚙️ 環境変数

### Frontend

```text
VITE_API_BASE_URL=http://localhost:8000
```

### Backend

```text
APP_ENV=development
DATABASE_URL=postgresql+asyncpg://...
SECRET_KEY=your-secret
FRONTEND_ORIGIN=http://localhost:5173
```

---

## 📌 設計上のポイント

* localStorage依存を排除し、APIベースに統一
* AlembicによるDBマイグレーション管理
* React Hookで状態管理を分離
* APIエラー時のUI崩壊を防止

---

## ⚠️ 制限事項

* メンバー招待機能は未完成
* 通知 / コメント機能なし
* ドラッグ&ドロップ未対応
* 本番監視・ログ基盤未整備

---

## 🔮 今後の改善

* サブスクリプション機能（Stripe）
* 権限管理（RBAC）
* タスクコメント・添付ファイル
* リアルタイム更新
* UI/UX改善

---

## 🧠 学んだこと

* フロントとバックの責務分離
* DBマイグレーションの重要性
* 状態管理の設計
* API設計とエラーハンドリング

---

## 📬 フィードバック

Issues または以下で受け付けています。

* GitHub Issues
* X: @youraccount

---
