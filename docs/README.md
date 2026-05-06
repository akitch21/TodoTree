# TodoTree Design Docs

このディレクトリは TodoTree の設計書置き場です。GitHub Markdown と Mermaid で、コードと一緒に軽量に更新します。

## Documents

- [Overview](./overview.md): アプリの目的、ユーザー、主要ユースケース
- [Architecture](./architecture.md): Frontend / Backend / DB / Deploy の構成
- [Domain Model](./domain-model.md): User / Project / Task / Invitation などの概念
- [API](./api.md): FastAPI の主要エンドポイントとフロー
- [Database](./database.md): SQLAlchemy models / Alembic migration に基づくDB設計
- [Deployment](./deployment.md): Vercel / Railway へのデプロイ手順
- [Documentation Guidelines](./documentation-guidelines.md): docs 更新ルール
- [ADR](./adr/README.md): Architecture Decision Records

## Rule

設計変更、API変更、DB変更、デプロイ手順変更を行う場合は、コード変更と同じ PR で `docs/` も更新します。

未確定の内容は断定せず、`未確定` または `TODO` として明記します。
