import { useState, useCallback } from "react";
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { deleteTaskFromTree, updateTaskInTree } from "@/lib/taskTree";
import { formatDate } from "@/lib/formatDate";
import type { Task, TaskStatus } from "@/types";

const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "待機中", in_progress: "進行中", done: "完了",
};
const STATUS_CYCLE: Record<TaskStatus, TaskStatus> = {
  pending: "in_progress", in_progress: "done", done: "pending",
};
const STATUS_VARIANTS: Record<TaskStatus, "secondary" | "success" | "muted"> = {
  pending: "secondary", in_progress: "success", done: "muted",
};

// ── Row ───────────────────────────────────────────────────────
interface RowProps {
  task:               Task;
  depth:              number;
  onUpdate:           (id: string, patch: Partial<Task>) => void;
  onDelete:           (id: string) => void;
  onAddChild:         (parentId: string) => void;
  onEdit:             (task: Task) => void;
  onSelect:           (task: Task) => void;
  confirmDeleteId:    string | null;
  setConfirmDeleteId: (id: string | null) => void;
}

function TaskRow({
  task, depth, onUpdate, onDelete, onAddChild,
  onEdit, onSelect, confirmDeleteId, setConfirmDeleteId,
}: RowProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren  = task.children.length > 0;
  const isConfirming = confirmDeleteId === task.id;
  const todayStr     = new Date().toISOString().split("T")[0];
  const isOverdue    = task.dueDate && task.dueDate < todayStr && task.status !== "done";

  return (
    <>
      <tr className="group border-b last:border-0 hover:bg-muted/40 transition-colors">
        {/* Expand toggle */}
        <td className="w-8 py-2 pl-2">
          <button
            onClick={() => hasChildren && setExpanded((v) => !v)}
            className="text-muted-foreground"
            style={{ visibility: hasChildren ? "visible" : "hidden" }}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        </td>

        {/* Task name */}
        <td className="py-2 pr-3" style={{ paddingLeft: depth * 20 }}>
          <div className="flex flex-col gap-0.5">
            <button
              onClick={() => onSelect(task)}
              className={
                "text-left text-sm font-medium hover:text-primary transition-colors " +
                (task.status === "done" ? "line-through text-muted-foreground" : "")
              }
            >
              {task.text}
            </button>
            {task.description && (
              <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                {task.description}
              </span>
            )}
          </div>
        </td>

        {/* 担当者 */}
        <td className="py-2 pr-3">
          {task.assignee ? (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <UserCheck size={12} className="shrink-0" />
              <span className="truncate max-w-[80px]">{task.assignee.name}</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground/50">—</span>
          )}
        </td>

        {/* 期限 */}
        <td className="py-2 pr-3 text-xs whitespace-nowrap">
          {task.dueDate ? (
            <span className={isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}>
              {formatDate(task.dueDate)}
            </span>
          ) : (
            <span className="text-muted-foreground/50">—</span>
          )}
        </td>

        {/* ステータス */}
        <td className="py-2 pr-3">
          <button onClick={() => onUpdate(task.id, { status: STATUS_CYCLE[task.status] })}>
            <Badge variant={STATUS_VARIANTS[task.status]} className="cursor-pointer select-none">
              {STATUS_LABELS[task.status]}
            </Badge>
          </button>
        </td>

        {/* 操作 */}
        <td className="py-2 pr-2">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isConfirming ? (
              <>
                <span className="text-xs text-destructive mr-1">削除しますか？</span>
                <button
                  onClick={() => { onDelete(task.id); setConfirmDeleteId(null); }}
                  className="rounded bg-destructive px-2 py-0.5 text-xs text-white hover:opacity-90"
                >削除</button>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="rounded border px-2 py-0.5 text-xs hover:bg-accent"
                >キャンセル</button>
              </>
            ) : (
              <>
                <button title="サブタスク追加" onClick={() => onAddChild(task.id)}
                  className="rounded p-1 hover:bg-accent text-muted-foreground hover:text-foreground">
                  <Plus size={13} />
                </button>
                <button title="編集" onClick={() => onEdit(task)}
                  className="rounded p-1 hover:bg-accent text-muted-foreground hover:text-foreground">
                  <Pencil size={13} />
                </button>
                <button title="削除" onClick={() => setConfirmDeleteId(task.id)}
                  className="rounded p-1 hover:bg-accent text-muted-foreground hover:text-destructive">
                  <Trash2 size={13} />
                </button>
              </>
            )}
          </div>
        </td>
      </tr>

      {expanded && task.children.map((child) => (
        <TaskRow key={child.id} task={child} depth={depth + 1}
          onUpdate={onUpdate} onDelete={onDelete}
          onAddChild={onAddChild} onEdit={onEdit} onSelect={onSelect}
          confirmDeleteId={confirmDeleteId} setConfirmDeleteId={setConfirmDeleteId}
        />
      ))}
    </>
  );
}

// ── Public component ──────────────────────────────────────────
interface Props {
  tasks:    Task[];
  onChange: (tasks: Task[]) => void;
  onAdd:    (parentId: string | null) => void;
  onEdit:   (task: Task) => void;
  onSelect: (task: Task) => void;
}

export default function TaskCrudTable({ tasks, onChange, onAdd, onEdit, onSelect }: Props) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleUpdate = useCallback(
    (id: string, patch: Partial<Task>) => onChange(updateTaskInTree(tasks, id, patch)),
    [tasks, onChange]
  );
  const handleDelete = useCallback(
    (id: string) => onChange(deleteTaskFromTree(tasks, id)),
    [tasks, onChange]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          タスク名をクリックして詳細を表示
        </p>
        <button
          onClick={() => onAdd(null)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus size={14} />タスク追加
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          タスクがありません。「タスク追加」から作成してください。
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="text-left text-xs font-medium text-muted-foreground">
                <th className="w-8 py-2 pl-2" />
                <th className="py-2 pr-3">タスク名</th>
                <th className="py-2 pr-3">担当者</th>
                <th className="py-2 pr-3">期限</th>
                <th className="py-2 pr-3">ステータス</th>
                <th className="py-2 pr-2 w-32">操作</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <TaskRow key={task.id} task={task} depth={0}
                  onUpdate={handleUpdate} onDelete={handleDelete}
                  onAddChild={(parentId) => onAdd(parentId)}
                  onEdit={onEdit} onSelect={onSelect}
                  confirmDeleteId={confirmDeleteId}
                  setConfirmDeleteId={setConfirmDeleteId}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
