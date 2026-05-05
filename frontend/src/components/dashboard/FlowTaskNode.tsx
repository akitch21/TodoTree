import { Handle, Position, type NodeProps } from "reactflow";
import { Circle, CircleCheck, FolderOpen } from "lucide-react";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

// ── Task node ─────────────────────────────────────────────────
export type FlowNodeData = {
  task:      Task;
  onToggle:  (id: string) => void;
  onSelect?: (task: Task) => void;
};

const sideHandle = "!border-primary/50 !bg-primary/50 !w-2 !h-2 !rounded-sm";

export function FlowTaskNode({ data }: NodeProps<FlowNodeData>) {
  const { task, onToggle, onSelect } = data;

  return (
    <div
      className={cn(
        "flex w-[200px] flex-col gap-1.5 rounded-xl border bg-card px-3 py-2.5 shadow-sm transition-shadow hover:shadow-md",
        task.status === "done" && "opacity-60"
      )}
    >
      {/* Tree handles */}
      <Handle type="target" id="bottom" position={Position.Bottom}
        className="!border-border !bg-muted" />
      <Handle type="source" id="top"    position={Position.Top}
        className="!border-border !bg-muted" />

      {/* Side handles for same-level dependency edges */}
      <Handle type="source" id="right-out" position={Position.Right} style={{ top: "38%" }} className={sideHandle} />
      <Handle type="source" id="left-out"  position={Position.Left}  style={{ top: "38%" }} className={sideHandle} />
      <Handle type="target" id="right-in"  position={Position.Right} style={{ top: "62%" }} className={sideHandle} />
      <Handle type="target" id="left-in"   position={Position.Left}  style={{ top: "62%" }} className={sideHandle} />

      {/* Content */}
      <div className="flex items-center gap-2">
        {/* Checkbox — toggles status */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          {task.status === "done"
            ? <CircleCheck size={15} className="text-primary" />
            : <Circle size={15} />}
        </button>

        {/* Title — clicking opens detail */}
        <button
          onClick={() => onSelect?.(task)}
          className={cn(
            "flex-1 truncate text-left text-sm font-medium leading-tight",
            "hover:text-primary transition-colors",
            task.status === "done" && "line-through"
          )}
        >
          {task.text}
        </button>
      </div>

      <StatusBadge status={task.status} />
    </div>
  );
}

// ── Project root node ─────────────────────────────────────────
export type ProjectNodeData = { label: string };

export function ProjectNode({ data }: NodeProps<ProjectNodeData>) {
  return (
    <div className="flex w-[200px] items-center gap-2.5 rounded-xl border-2 border-primary bg-primary/10 px-4 py-3 shadow-md">
      <FolderOpen size={16} className="shrink-0 text-primary" />
      <span className="flex-1 truncate text-sm font-semibold text-primary">
        {data.label}
      </span>
      <Handle type="source" id="top" position={Position.Top}
        className="!border-primary !bg-primary" />
    </div>
  );
}

export const nodeTypes = { taskNode: FlowTaskNode, projectNode: ProjectNode };
