import type { ReactNode } from "react";
import { Columns3, List, Network, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DirectoryView } from "@/components/dashboard/DirectoryView";
import { TreeView } from "@/components/dashboard/TreeView";
import { KanbanView } from "@/components/dashboard/KanbanView";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/types";

export type ViewMode = "list" | "tree" | "kanban";

const VIEW_BUTTONS: { mode: ViewMode; label: string; icon: ReactNode }[] = [
  { mode: "list",   label: "リスト",   icon: <List     size={13} /> },
  { mode: "kanban", label: "カンバン", icon: <Columns3 size={13} /> },
  { mode: "tree",   label: "ツリー",   icon: <Network  size={13} /> },
];

interface TaskPanelProps {
  tasks:            Task[];
  viewMode:         ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onToggle:         (id: string) => void;
  onStatusChange?:  (id: string, status: TaskStatus) => void;
  projectName?:     string;
  onAddTask?:       () => void;
  onSelectTask?:    (task: Task) => void;
}

export function TaskPanel({
  tasks, viewMode, onViewModeChange, onToggle, onStatusChange,
  projectName, onAddTask, onSelectTask,
}: TaskPanelProps) {
  const title =
    viewMode === "tree"   ? "Task Tree" :
    viewMode === "kanban" ? "カンバン"  : "Task List";

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-xl border bg-card"
      style={{ minHeight: "min(420px, calc(100vh - 280px))" }}>

      <div className="flex shrink-0 items-center justify-between px-4 py-3">
        <span className="text-sm font-semibold">{title}</span>
        <div className="flex items-center gap-2">
          {onAddTask && (
            <Button variant="ghost" size="sm" onClick={onAddTask} data-testid="task-panel-add-task">
              <Plus size={14} />タスク追加
            </Button>
          )}
          <div className="flex items-center rounded-lg border p-0.5">
            {VIEW_BUTTONS.map(({ mode, label, icon }) => (
              <button key={mode} onClick={() => onViewModeChange(mode)}
                data-testid={"task-view-" + mode}
                aria-label={label}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors md:px-3",
                  viewMode === mode
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}>
                {icon}
                <span className="hidden md:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <Separator />

      <div className="relative flex-1 overflow-hidden">
        {viewMode === "list" && (
          <DirectoryView
            tasks={tasks}
            onToggle={onToggle}
            onSelect={onSelectTask}
          />
        )}
        {viewMode === "tree" && (
          /* モバイルではボトムナビ(64px)分だけ下を空けて操作ボタンが隠れないようにする */
          <div className="absolute inset-0 pb-16 md:pb-0">
            <TreeView
              tasks={tasks}
              projectName={projectName ?? ""}
              onToggle={onToggle}
              onSelectTask={onSelectTask}
            />
          </div>
        )}
        {viewMode === "kanban" && (
          <KanbanView
            tasks={tasks}
            onStatusChange={onStatusChange ?? (() => undefined)}
          />
        )}
      </div>
    </div>
  );
}
