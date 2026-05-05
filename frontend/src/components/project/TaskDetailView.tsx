import { useMemo } from "react";
import {
  Calendar, UserCircle, UserCheck, GitBranch, Link2,
  CheckCircle2, Circle, Clock,
} from "lucide-react";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { flattenTasks } from "@/lib/taskTree";
import { formatDate, formatDateTime } from "@/lib/formatDate";
import type { Task } from "@/types";

interface Props {
  task:       Task;
  allTasks:   Task[];
  onEdit:     (task: Task) => void;
  onClose:    () => void;
  closeLabel?: string;
}

export default function TaskDetailView({
  task, allTasks, onEdit, onClose, closeLabel = "閉じる",
}: Props) {
  const taskById = useMemo(() => {
    const flat = flattenTasks(allTasks);
    return new Map(flat.map((t) => [t.id, t]));
  }, [allTasks]);

  const parentTask = task.parentId ? taskById.get(task.parentId) : null;
  const todayStr   = new Date().toISOString().split("T")[0];

  return (
    <div className="flex flex-col gap-5">
      {/* Title + status */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold leading-snug">{task.text}</h3>
          <StatusBadge status={task.status} />
        </div>
        {task.description && (
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {task.description}
          </p>
        )}
      </div>

      {/* Meta fields */}
      <dl className="flex flex-col gap-3 text-sm">

        {/* 起票者 */}
        {task.reporter && (
          <Row icon={<UserCircle size={14} />} label="起票者">
            {task.reporter.name}
          </Row>
        )}

        {/* 担当者 */}
        <Row icon={<UserCheck size={14} />} label="担当者">
          {task.assignee ? (
            <span className="font-medium">{task.assignee.name}</span>
          ) : (
            <span className="text-muted-foreground">担当者なし</span>
          )}
        </Row>

        {/* 発行日時 */}
        <Row icon={<Clock size={14} />} label="発行日時">
          {formatDateTime(task.createdAt)}
        </Row>

        {/* 期限 */}
        <Row icon={<Calendar size={14} />} label="期限">
          {task.dueDate ? (
            <span className={
              task.dueDate < todayStr && task.status !== "done"
                ? "text-destructive font-medium"
                : ""
            }>
              {formatDate(task.dueDate)}
            </span>
          ) : "—"}
        </Row>

        {/* ステータス */}
        <Row
          icon={task.status === "done"
            ? <CheckCircle2 size={14} className="text-primary" />
            : <Circle size={14} className="text-muted-foreground" />}
          label="ステータス"
        >
          {{ pending: "待機中", in_progress: "進行中", done: "完了" }[task.status]}
        </Row>
      </dl>

      {/* 依存関係 */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <GitBranch size={13} />
          依存関係
        </div>

        <div className="rounded-lg border bg-background p-2.5 flex flex-col gap-1">
          <span className="text-[10px] font-medium text-muted-foreground">親タスク（実線）</span>
          {parentTask ? (
            <span className="text-sm font-medium">{parentTask.text}</span>
          ) : (
            <span className="text-sm text-muted-foreground">なし（ルートタスク）</span>
          )}
        </div>

        {task.extraDependencies && task.extraDependencies.length > 0 && (
          <div className="rounded-lg border bg-background p-2.5 flex flex-col gap-1.5">
            <span className="text-[10px] font-medium text-muted-foreground">追加の依存先（点線）</span>
            <ul className="flex flex-col gap-1">
              {task.extraDependencies.map((depId) => {
                const dep = taskById.get(depId);
                return (
                  <li key={depId} className="flex items-center gap-1.5 text-sm">
                    <Link2 size={12} className="text-primary shrink-0" />
                    {dep?.text ?? depId}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* サブタスク */}
      {task.children.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            サブタスク（{task.children.length}件）
          </span>
          <ul className="flex flex-col gap-1">
            {task.children.map((child) => (
              <li key={child.id}
                className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm"
              >
                {child.status === "done"
                  ? <CheckCircle2 size={13} className="text-primary shrink-0" />
                  : <Circle size={13} className="text-muted-foreground shrink-0" />}
                <span className={child.status === "done" ? "line-through text-muted-foreground" : ""}>
                  {child.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button onClick={onClose}
          className="flex-1 rounded-lg border py-2 text-sm font-medium hover:bg-accent transition-colors"
        >
          {closeLabel}
        </button>
        <button onClick={() => onEdit(task)}
          className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          編集
        </button>
      </div>
    </div>
  );
}

function Row({ icon, label, children }: {
  icon: React.ReactNode; label: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <dt className="flex items-center gap-1.5 text-muted-foreground w-24 shrink-0 pt-px">
        {icon}
        <span className="text-xs">{label}</span>
      </dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}
