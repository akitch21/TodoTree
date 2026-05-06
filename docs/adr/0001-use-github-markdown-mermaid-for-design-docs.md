# 0001: Use GitHub Markdown and Mermaid for Design Docs

## Status

Accepted

## Context

TodoTree は個人または小規模チームで継続開発する規模のアプリです。設計書を重い外部ツールで管理すると、コード変更とドキュメント更新が分離しやすくなります。

現在のリポジトリは GitHub で管理され、Markdown と Mermaid はGitHub上で表示できます。

## Decision

設計書管理の標準を GitHub + Markdown + Mermaid とします。

- 設計書は `docs/` に置く
- 図は Mermaid を使う
- 設計変更時はコードと同じ PR で docs を更新する
- 大きな設計判断は `docs/adr/` に ADR として残す

## Consequences

良い点:

- コードと設計書を同じレビュー単位で扱える
- GitHub 上で差分レビューできる
- Mermaid により構成図やER図を追加しやすい
- 小規模開発でも継続しやすい

注意点:

- ドキュメント更新を忘れるとすぐ古くなる
- Mermaid が複雑になりすぎると読みづらくなる
- 実装から確認できない内容は、未確定として明記する必要がある
