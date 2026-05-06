"""
Python-side task tree builder.

ORM の lazy="raise" に触れずに Task レコード（フラットリスト）から
ネストしたツリー構造を構築する。

設計方針:
  - DB からは `SELECT * FROM tasks WHERE project_id = ?` で全件フラット取得
  - parent_id の付け合わせを Python の dict で O(n) で解決
  - ORM の relationship（children / parent）には一切アクセスしない
  - Pydantic モデル（TaskTreeNode）へのマッピングはここで完結させる
"""
from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.task import Task
    from app.schemas.task import TaskTreeNode


def build_task_tree(flat_tasks: "list[Task]") -> "list[TaskTreeNode]":
    """
    フラットな Task ORM オブジェクトのリストをツリー構造に変換して返す。

    Args:
        flat_tasks: project_id が同一の Task ORM オブジェクト一覧
                    （children / parent リレーションには触れていないこと）
    Returns:
        ルートタスク（parent_id=None）を頂点とする TaskTreeNode のリスト
    """
    if not flat_tasks:
        return []

    # import here to avoid circular dependency at module load time
    from app.schemas.task import TaskTreeNode  # noqa: PLC0415

    # ── Pass 1: ORM → Pydantic（children は空のまま）───────────────────
    node_map: dict[uuid.UUID, TaskTreeNode] = {}
    for t in flat_tasks:
        node_map[t.id] = TaskTreeNode(
            id=t.id,
            project_id=t.project_id,
            parent_id=t.parent_id,
            title=t.title,
            description=t.description,
            status=t.status,
            assignee_id=t.assignee_id,
            due_date=t.due_date,
            created_at=t.created_at,
            updated_at=t.updated_at,
            children=[],
        )

    # ── Pass 2: parent_id で親ノードの children に追加 ─────────────────
    roots: list[TaskTreeNode] = []
    for t in flat_tasks:
        node = node_map[t.id]
        if t.parent_id is None or t.parent_id not in node_map:
            # parent_id が NULL、または参照先が存在しない → ルート扱い
            roots.append(node)
        else:
            node_map[t.parent_id].children.append(node)

    return roots
