import { useState } from "react";
import { ChevronDown, ChevronRight, Circle, CircleCheck } from "lucide-react";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

interface DirRowProps {
  task:      Task;
  depth:     number;
  onToggle:  (id: string) => void;
  onSelect?: (task: Task) => void;
}

function DirRow({ task, depth, onToggle, onSelect }: DirRowProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = task.children.length > 0;

  return (
    <>
      <div
        className="group flex items-center gap-1.5 rounded-lg px-2 py-1.5 hover:bg-accent"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {/* 展開/折りたたみ */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 text-muted-foreground"
          style={{ visibility: hasChildren ? "visible" : "hidden" }}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* ステータストグル */}
        <button
          onClick={() => onToggle(task.id)}
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          {task.status === "done"
            ? <CircleCheck size={15} className="text-primary" />
            : <Circle size={15} />}
        </button>

        {/* タスク名 — クリックで詳細表示 */}
        <button
          onClick={() => onSelect?.(task)}
          className={cn(
            "flex-1 text-left text-sm transition-colors",
            onSelect ? "hover:text-primary" : "",
            task.status === "done"
              ? "text-muted-foreground line-through"
              : "text-foreground"
          )}
        >
          {task.text}
        </button>

        <span className="hidden group-hover:block">
          <StatusBadge status={task.status} />
        </span>
      </div>

      {hasChildren && expanded && task.children.map((child) => (
        <DirRow
          key={child.id}
          task={child}
          depth={depth + 1}
          onToggle={onToggle}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}

interface DirectoryViewProps {
  tasks:     Task[];
  onToggle:  (id: string) => void;
  onSelect?: (task: Task) => void;
}

export function DirectoryView({ tasks, onToggle, onSelect }: DirectoryViewProps) {
  return (
    <div className="flex-1 overflow-y-auto p-3">
      {tasks.map((task) => (
        <DirRow key={task.id} task={task} depth={0} onToggle={onToggle} onSelect={onSelect} />
      ))}
    </div>
  );
}
