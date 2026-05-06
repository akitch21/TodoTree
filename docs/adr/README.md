# ADR

ADR は Architecture Decision Record の略です。後から「なぜこの設計にしたのか」を追えるように残します。

## Format

各ADRは次の構成にします。

- Title
- Status
- Context
- Decision
- Consequences

## When to Add

新しい ADR を追加する条件:

- 技術選定を変える
- DBや認証など戻しにくい設計を変える
- デプロイ/運用方針を変える
- 複数案から明示的に選んだ判断がある

## Naming

```text
NNNN-short-kebab-case-title.md
```

例:

```text
0002-change-auth-token-storage.md
```

番号は4桁連番にします。
