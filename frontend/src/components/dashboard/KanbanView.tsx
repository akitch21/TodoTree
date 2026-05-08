import { useMemo, useState } from "react";
import { AlertTriangle, Calendar, ChevronLeft, ChevronRight, GripVertical, User } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { flattenTasks } from "@/lib/taskTree";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/types";

// ── Column definitions ───────────────────────────────────────────────────────

interface Column {
  status:  TaskStatus;
  label:   string;
  accent:  string;   // Tailwind text class
  ring:    string;   // Tailwind border/ring class for header badge
  bg:      string;   // Tailwind bg class for column
  /** highlight when something is being dragged over */
  bgOver:  string;
}

const COLUMNS: Column[] = [
  {
    status: "pending",     label: "待機中",
    accent: "text-muted-foreground", ring: "border-border",
    bg:     "bg-muted/30",
    bgOver: "bg-muted/60 ring-2 ring-muted-foreground/40",
  },
  {
    status: "in_progress", label: "進行中",
    accent: "text-amber-600", ring: "border-amber-400/60",
    bg:     "bg-amber-50/40 dark:bg-amber-950/20",
    bgOver: "bg-amber-100/70 dark:bg-amber-950/40 ring-2 ring-amber-400/60",
  },
  {
    status: "done",        label: "完了",
    accent: "text-primary", ring: "border-primary/40",
    bg:     "bg-primary/5",
    bgOver: "bg-primary/15 ring-2 ring-primary/50",
  },
];

const STATUS_ORDER: TaskStatus[] = ["pending", "in_progress", "done"];

function prevStatus(s: TaskStatus): TaskStatus | null {
  const i = STATUS_ORDER.indexOf(s);
  return i > 0 ? STATUS_ORDER[i - 1] : null;
}
function nextStatus(s: TaskStatus): TaskStatus | null {
  const i = STATUS_ORDER.indexOf(s);
  return i < STATUS_ORDER.length - 1 ? STATUS_ORDER[i + 1] : null;
}

// ── Props ────────────────────────────────────────────────────────────────────

interface KanbanViewProps {
  tasks:           Task[];
  onStatusChange?: (id: string, status: TaskStatus) => void;
  onSelect?:       (task: Task) => void;
}

// ── Main component ───────────────────────────────────────────────────────────

export function KanbanView({ tasks, onStatusChange, onSelect }: KanbanViewProps) {
  const flat = useMemo(() => flattenTasks(tasks), [tasks]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const byStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = { pending: [], in_progress: [], done: [] };
    for (const t of flat) map[t.status].push(t);
    return map;
  }, [flat]);

  const activeTask = useMemo(
    () => (activeId ? flat.find((t) => t.id === activeId) ?? null : null),
    [activeId, flat],
  );

  const sensors = useSensors(
    // 8px動かさないとドラッグ開始しないことで、クリックでカード詳細を開く挙動を維持
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const taskId       = String(active.id);
    const targetStatus = String(over.id) as TaskStatus;
    if (!STATUS_ORDER.includes(targetStatus)) return;
    const task = flat.find((t) => t.id === taskId);
    if (!task) return;
    if (task.status === targetStatus) return;
    onStatusChange?.(taskId, targetStatus);
  }

  if (flat.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        タスクがありません
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex h-full gap-3 overflow-x-auto p-4 pb-2" data-testid="kanban-view">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.status}
            col={col}
            tasks={byStatus[col.status]}
            onStatusChange={onStatusChange}
            onSelect={onSelect}
            isDragging={activeId !== null}
          />
        ))}
      </div>

      {/* Drag overlay — animates the dragged card on top of everything */}
      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <KanbanCardPresentation
            task={activeTask}
            isOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// ── Column ───────────────────────────────────────────────────────────────────

function KanbanColumn({
  col, tasks, onStatusChange, onSelect, isDragging,
}: {
  col:             Column;
  tasks:           Task[];
  onStatusChange?: (id: string, status: TaskStatus) => void;
  onSelect?:       (task: Task) => void;
  isDragging:      boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.status });

  return (
    <div className="flex w-[240px] shrink-0 flex-col gap-2">
      {/* Column header */}
      <div className="flex items-center gap-2 px-1">
        <span className={"text-xs font-semibold uppercase tracking-wide " + col.accent}>
          {col.label}
        </span>
        <span className={"rounded-full border px-1.5 py-0.5 text-[10px] font-medium " + col.ring + " " + col.accent}>
          {tasks.length}
        </span>
      </div>

      {/* Cards (droppable) */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-col gap-2 rounded-xl border p-2 min-h-[120px] transition-all duration-150",
          isOver ? col.bgOver : col.bg,
          isDragging && !isOver && "opacity-90",
        )}
      >
        {tasks.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-6 text-[11px] text-muted-foreground/60 select-none">
            {isOver ? "ここに移動" : "なし"}
          </div>
        ) : (
          tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              onStatusChange={onStatusChange}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── Card (draggable wrapper) ─────────────────────────────────────────────────

function KanbanCard({
  task, onStatusChange, onSelect,
}: {
  task:            Task;
  onStatusChange?: (id: string, status: TaskStatus) => void;
  onSelect?:       (task: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  // While dragging, the original card slot is dimmed; the actual visual is in DragOverlay
  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity:   isDragging ? 0.35 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      onClick={() => !isDragging && onSelect?.(task)}
    >
      <KanbanCardPresentation
        task={task}
        onStatusChange={onStatusChange}
        dragHandleProps={listeners}
      />
    </div>
  );
}

// ── Card visual (used both inline and inside DragOverlay) ────────────────────

interface CardPresentationProps {
  task:             Task;
  onStatusChange?:  (id: string, status: TaskStatus) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;
  isOverlay?:       boolean;
}

function KanbanCardPresentation({
  task, onStatusChange, dragHandleProps, isOverlay,
}: CardPresentationProps) {
  const todayStr  = new Date().toISOString().split("T")[0];
  const isOverdue = task.dueDate && task.dueDate < todayStr && task.status !== "done";
  const isToday   = task.dueDate === todayStr && task.status !== "done";

  const prev = prevStatus(task.status);
  const next = nextStatus(task.status);

  const subtaskTotal = task.children.length;
  const subtaskDone  = task.children.filter((c) => c.status === "done").length;

  return (
    <div
      data-testid="kanban-card"
      data-task-title={task.text}
      className={cn(
        "group relative flex flex-col gap-2 rounded-lg border bg-card p-2.5 shadow-sm",
        "hover:border-primary/40 hover:shadow-md transition-shadow duration-150",
        task.status === "done" && "opacity-70",
        isOverlay && "shadow-xl ring-2 ring-primary/40 cursor-grabbing rotate-1",
      )}
    >
      {/* Drag handle: only attaches when not overlay */}
      {dragHandleProps && (
        <button
          type="button"
          {...dragHandleProps}
          aria-label="ドラッグして移動"
          className="absolute left-1 top-1.5 cursor-grab rounded p-0.5 text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
          // クリック→onSelectが発火しないように
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={11} />
        </button>
      )}

      {/* Title */}
      <p className={cn(
        "pl-4 text-xs font-medium leading-snug",
        task.status === "done" && "line-through text-muted-foreground",
      )}>
        {task.text}
      </p>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-1.5 pl-4">
        {task.dueDate && (
          <span className={cn(
            "flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-medium",
            isOverdue
              ? "bg-destructive/10 text-destructive"
              : isToday
              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              : "bg-muted text-muted-foreground",
          )}>
            {isOverdue ? <AlertTriangle size={9} /> : <Calendar size={9} />}
            {formatShortDate(task.dueDate)}
          </span>
        )}

        {task.assignee && (
          <span className="flex items-center gap-0.5 rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
            <User size={9} />
            {task.assignee.name.split(" ")[0]}
          </span>
        )}

        {subtaskTotal > 0 && (
          <span className="rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
            {subtaskDone}/{subtaskTotal}
          </span>
        )}
      </div>

      {/* Status-move buttons — shown on hover (and not in overlay) */}
      {!isOverlay && onStatusChange && (prev || next) && (
        <div className="absolute inset-x-0 bottom-0 flex translate-y-full justify-between px-0.5 pb-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none group-hover:pointer-events-auto">
          <button
            onClick={(e) => { e.stopPropagation(); prev && onStatusChange(task.id, prev); }}
            disabled={!prev}
            title={prev ? "← " + COLUMNS.find((c) => c.status === prev)?.label : undefined}
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full border bg-card shadow-sm text-muted-foreground",
              "hover:border-primary/60 hover:text-primary transition-colors",
              !prev && "invisible",
            )}
          >
            <ChevronLeft size={11} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next && onStatusChange(task.id, next); }}
            disabled={!next}
            data-testid="kanban-next-status"
            title={next ? "→ " + COLUMNS.find((c) => c.status === next)?.label : undefined}
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full border bg-card shadow-sm text-muted-foreground",
              "hover:border-primary/60 hover:text-primary transition-colors",
              !next && "invisible",
            )}
          >
            <ChevronRight size={11} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatShortDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return (d.getMonth() + 1) + "/" + d.getDate();
}
