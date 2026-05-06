# Domain Model

このページは SQLAlchemy models と routers から確認できる概念だけをまとめます。

## Concepts

### User

認証ユーザーです。メールアドレスは一意です。plan / subscription 関連の列がありますが、課金処理は未実装です。

### Project

タスクをまとめる単位です。作成者は `ProjectMember` として owner になります。同名プロジェクトは別IDで作成できます。

### ProjectMember

User と Project の所属関係です。role は `owner`, `admin`, `member` がコード上で使われています。

### ProjectInvitation

プロジェクトへの招待です。メールアドレス、role、token、status、有効期限を持ちます。招待されたメールアドレスのユーザーが承認すると `ProjectMember` が作られます。

### Task

プロジェクトに属するタスクです。`parent_id` により自己参照し、階層タスクを表現します。

### PersonalTask

ユーザー個人のタスクです。プロジェクトには属しません。

## Domain Diagram

```mermaid
classDiagram
    class User {
        UUID id
        string name
        string email
        string plan
        string subscription_status
    }
    class Project {
        UUID id
        string name
        string description
        string status
    }
    class ProjectMember {
        UUID id
        UUID project_id
        UUID user_id
        string role
    }
    class ProjectInvitation {
        UUID id
        UUID project_id
        string email
        string role
        string token
        string status
        datetime expires_at
    }
    class Task {
        UUID id
        UUID project_id
        UUID parent_id
        string title
        string status
        UUID assignee_id
    }
    class PersonalTask {
        UUID id
        UUID user_id
        string text
        string status
    }

    User "1" --> "many" ProjectMember
    Project "1" --> "many" ProjectMember
    Project "1" --> "many" ProjectInvitation
    Project "1" --> "many" Task
    Task "1" --> "many" Task : children
    User "1" --> "many" PersonalTask
```

## Hierarchical Tasks

`Task.parent_id` が `tasks.id` を参照します。`parent_id IS NULL` のタスクがルートタスクです。APIでは `selectinload(Task.children).selectinload(Task.children)` により、現在は主に2階層先まで読み込む実装です。

未確定:

- UI/仕様として最大階層数を制限するかどうか
- タスク依存関係をDBで正式に管理するかどうか
