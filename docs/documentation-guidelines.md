# Documentation Guidelines

## Update Rule

設計、API、DB、デプロイ、認証、権限に関わる変更は、コード変更と同じ PR で `docs/` を更新します。

## Fact vs Unknown

- コード、README、migration から確認できる内容は事実として書く
- 確認できない内容は `未確定` または `TODO` と書く
- 推測を仕様として断定しない

## Mermaid

- GitHubで表示できる Mermaid を使う
- 複雑にしすぎず、1図1テーマにする
- 推奨:
  - システム構成: `flowchart`
  - DB/ドメイン: `erDiagram` または `classDiagram`
  - APIフロー: `sequenceDiagram`

## ADR

ADR を追加すべき変更:

- 技術スタックの変更
- DB設計の大きな変更
- 認証/権限モデルの変更
- デプロイ先や運用方針の変更
- 後から理由を知る必要がある判断

## Checklist

PR作成前に確認:

- [ ] README と docs の内容が矛盾していない
- [ ] API変更があれば `docs/api.md` を更新した
- [ ] DB変更があれば `docs/database.md` を更新した
- [ ] デプロイ手順変更があれば `docs/deployment.md` を更新した
- [ ] 大きな設計判断があれば ADR を追加した
- [ ] Mermaid が GitHub で表示できる記法になっている
- [ ] 古い記述を残していない
