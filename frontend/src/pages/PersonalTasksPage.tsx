import { useState, useCallback, useMemo, useEffect } from "react";
import {
  Plus, CheckCircle2, Circle, Clock,
  Calendar, AlignLeft, ChevronDown, AlertCircle, Loader2, X,
} from "lucide-react";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { formatDate, formatDateTime } from "@/lib/formatDate";
import { usePersonalTasks, type PersonalTask } from "@/hooks/usePersonalTasks";
import type { TaskStatus } from "@/types";

// ── Form data shape ───────────────────────────────────────────
interface PersonalTaskFormData {
  text:        string;
  description: string;
  dueDate:     string;
  status:      TaskStatus;
}

// ── Right pane ────────────────────────────────────────────────
type RightPane =
  | { type: "add" }
  | { type: "edit";   task: PersonalTask }
  | { type: "detail"; task: PersonalTask };

// ── Grouping logic ────────────────────────────────────────────
interface Groups {
  overdue:  PersonalTask[];
  today:    PersonalTask[];
  thisWeek: PersonalTask[];
  later:    PersonalTask[];
  noDue:    PersonalTask[];
  done:     PersonalTask[];
}

function groupTasks(tasks: PersonalTask[]): Groups {
  const todayStr = new Date().toISOString().split("T")[0];
  const endOfWeek = new Date();
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  const endOfWeekStr = endOfWeek.toISOString().split("T")[0];

  const g: Groups = { overdue: [], today: [], thisWeek: [], later: [], noDue: [], done: [] };

  for (const t of tasks) {
    if (t.status === "done") { g.done.push(t); continue; }
    if (!t.due_date)          { g.noDue.push(t); continue; }
    if (t.due_date < todayStr)      { g.overdue.push(t); continue; }
    if (t.due_date === todayStr)    { g.today.push(t); continue; }
    if (t.due_date <= endOfWeekStr) { g.thisWeek.push(t); continue; }
    g.later.push(t);
  }
  return g;
}

const makeEmpty = (): PersonalTaskFormData => ({
  text: "", description: "", dueDate: "", status: "pending",
});

// ── Panel title helper ────────────────────────────────────────
function panelTitle(pane: RightPane) {
  if (pane.type === "add")    return "タスクを追加";
  if (pane.type === "edit")   return "タスクを編集";
  return "タスク詳細";
}

// ── Main page ─────────────────────────────────────────────────
export default function PersonalTasksPage() {
  const { tasks, loading, error, addTask, updateTask, deleteTask } = usePersonalTasks();

  const [rightPane,   setRightPane]   = useState<RightPane>({ type: "add" });
  const [panelOpen,   setPanelOpen]   = useState(false);   // mobile bottom sheet
  const [showDone,    setShowDone]    = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const groups     = useMemo(() => groupTasks(tasks), [tasks]);
  const selectedId = rightPane.type !== "add" ? rightPane.task.id : undefined;
  const activeCount = tasks.filter((t) => t.status !== "done").length;

  // Open panel helpers
  const openPanel = useCallback((pane: RightPane) => {
    setRightPane(pane);
    setPanelOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setRightPane({ type: "add" });
    setPanelOpen(false);
  }, []);

  // Cycle status: pending → in_progress → done → pending
  const toggleStatus = useCallback(async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const next: TaskStatus =
      task.status === "pending"     ? "in_progress" :
      task.status === "in_progress" ? "done"        : "pending";
    await updateTask(id, { status: next });
  }, [tasks, updateTask]);

  const handleSelect = useCallback((task: PersonalTask) => {
    openPanel({ type: "detail", task });
  }, [openPanel]);

  const handleEdit = useCallback((task: PersonalTask) => {
    openPanel({ type: "edit", task });
  }, [openPanel]);

  const handleSubmit = useCallback(async (data: PersonalTaskFormData, id?: string) => {
    setSubmitError(null);
    try {
      if (id) {
        await updateTask(id, {
          text:        data.text.trim(),
          description: data.description.trim() || "",
          status:      data.status,
          due_date:    data.dueDate || null,
        });
        closePanel();
      } else {
        await addTask({
          text:        data.text.trim(),
          description: data.description.trim() || "",
          status:      "pending",
          due_date:    data.dueDate || null,
        });
        // On mobile: close panel after add. On desktop: keep form open for rapid entry.
        if (window.innerWidth < 768) setPanelOpen(false);
      }
    } catch {
      setSubmitError("保存に失敗しました。再度お試しください。");
    }
  }, [addTask, updateTask, closePanel]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteTask(id);
      closePanel();
    } catch {
      setSubmitError("削除に失敗しました。再度お試しください。");
    }
  }, [deleteTask, closePanel]);

  // Keep detail/edit pane in sync when tasks state changes
  const syncedTask = useMemo(() => {
    if (rightPane.type === "add") return null;
    return tasks.find((t) => t.id === rightPane.task.id) ?? null;
  }, [tasks, rightPane]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-muted-foreground">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm">読み込み中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-destructive">
        <AlertCircle size={24} />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">個人タスク</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeCount} 件のアクティブなタスク · 完了 {groups.done.length} 件
          </p>
        </div>
        <button
          onClick={() => openPanel({ type: "add" })}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus size={15} />
          タスクを追加
        </button>
      </div>

      {/* Error */}
      {submitError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <AlertCircle size={14} />
          {submitError}
        </div>
      )}

      {/* Body: task list (left) + form panel (right on desktop) */}
      <div className="flex flex-1 min-h-0 gap-4">

        {/* Task list — full width on mobile, flex-1 on desktop */}
        <div className="flex-1 min-w-0 overflow-y-auto space-y-5 pr-1">
          <TaskGroup
            label="期限切れ" accent="text-destructive"
            tasks={groups.overdue}
            selectedId={selectedId} onSelect={handleSelect} onToggle={toggleStatus}
          />
          <TaskGroup
            label="今日"
            tasks={groups.today}
            selectedId={selectedId} onSelect={handleSelect} onToggle={toggleStatus}
          />
          <TaskGroup
            label="今週"
            tasks={groups.thisWeek}
            selectedId={selectedId} onSelect={handleSelect} onToggle={toggleStatus}
          />
          <TaskGroup
            label="それ以降"
            tasks={groups.later}
            selectedId={selectedId} onSelect={handleSelect} onToggle={toggleStatus}
          />
          <TaskGroup
            label="期限なし"
            tasks={groups.noDue}
            selectedId={selectedId} onSelect={handleSelect} onToggle={toggleStatus}
          />

          {/* Done — collapsible */}
          {groups.done.length > 0 && (
            <div>
              <button
                onClick={() => setShowDone((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors mb-2"
              >
                <ChevronDown
                  size={13}
                  className={"transition-transform duration-200 " + (showDone ? "" : "-rotate-90")}
                />
                完了済み
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-normal normal-case">
                  {groups.done.length}
                </span>
              </button>
              {showDone && (
                <TaskGroup
                  tasks={groups.done}
                  selectedId={selectedId} onSelect={handleSelect} onToggle={toggleStatus}
                />
              )}
            </div>
          )}

          {activeCount === 0 && groups.done.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
              <CheckCircle2 size={32} className="opacity-30" />
              <p className="text-sm text-center">
                タスクがありません。<br />「＋ タスクを追加」ボタンから追加しましょう。
              </p>
            </div>
          )}
        </div>

        {/* Desktop sidebar panel (hidden on mobile) */}
        <div className="hidden md:flex md:w-[340px] md:shrink-0 md:flex-col md:overflow-y-auto md:rounded-xl md:border md:bg-card md:p-5">
          <PanelContent
            rightPane={rightPane}
            syncedTask={syncedTask}
            onEdit={handleEdit}
            onClose={closePanel}
            onDelete={handleDelete}
            onSubmit={handleSubmit}
          />
        </div>
      </div>

      {/* Mobile: bottom sheet overlay */}
      {panelOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={closePanel}
        />
      )}

      {/* Mobile: bottom sheet panel */}
      <div
        className={
          "fixed inset-x-0 bottom-16 z-30 max-h-[78vh] rounded-t-2xl border-t bg-card shadow-2xl " +
          "transition-transform duration-300 ease-out md:hidden " +
          (panelOpen ? "translate-y-0" : "translate-y-[110%]")
        }
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Sheet header */}
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="mx-auto mr-0 h-1 w-8 rounded-full bg-muted-foreground/30 absolute left-1/2 -translate-x-1/2 top-2" />
          <h3 className="text-sm font-semibold">{panelTitle(rightPane)}</h3>
          <button
            onClick={closePanel}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Sheet body */}
        <div className="overflow-y-auto p-5">
          <PanelContent
            rightPane={rightPane}
            syncedTask={syncedTask}
            onEdit={handleEdit}
            onClose={closePanel}
            onDelete={handleDelete}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}

// ── Shared panel content ──────────────────────────────────────
function PanelContent({
  rightPane, syncedTask, onEdit, onClose, onDelete, onSubmit,
}: {
  rightPane:  RightPane;
  syncedTask: PersonalTask | null;
  onEdit:     (t: PersonalTask) => void;
  onClose:    () => void;
  onDelete:   (id: string) => Promise<void>;
  onSubmit:   (data: PersonalTaskFormData, id?: string) => Promise<void>;
}) {
  if (rightPane.type === "detail" && syncedTask) {
    return (
      <PersonalTaskDetail
        task={syncedTask}
        onEdit={onEdit}
        onClose={onClose}
        onDelete={onDelete}
      />
    );
  }
  if (rightPane.type === "edit" && syncedTask) {
    return (
      <PersonalTaskForm
        mode="edit"
        initialData={syncedTask}
        onSubmit={onSubmit}
        onCancel={onClose}
      />
    );
  }
  return (
    <PersonalTaskForm
      mode="add"
      onSubmit={onSubmit}
      onCancel={() => {}}
    />
  );
}

// ── TaskGroup ─────────────────────────────────────────────────
function TaskGroup({
  label, accent, tasks, selectedId, onSelect, onToggle,
}: {
  label?:      string;
  accent?:     string;
  tasks:       PersonalTask[];
  selectedId?: string;
  onSelect:    (t: PersonalTask) => void;
  onToggle:    (id: string) => void;
}) {
  if (tasks.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <div
          className={
            "flex items-center gap-2 text-xs font-semibold uppercase tracking-wide mb-1 " +
            (accent ?? "text-muted-foreground")
          }
        >
          {label}
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-normal normal-case">
            {tasks.length}
          </span>
        </div>
      )}
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          selected={task.id === selectedId}
          onSelect={onSelect}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}

// ── TaskRow ───────────────────────────────────────────────────
function TaskRow({
  task, selected, onSelect, onToggle,
}: {
  task:      PersonalTask;
  selected:  boolean;
  onSelect:  (t: PersonalTask) => void;
  onToggle:  (id: string) => void;
}) {
  const todayStr  = new Date().toISOString().split("T")[0];
  const isOverdue = task.due_date && task.due_date < todayStr && task.status !== "done";

  return (
    <div
      onClick={() => onSelect(task)}
      className={
        "flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors " +
        (selected
          ? "bg-primary/5 border-primary/30"
          : "bg-card hover:bg-accent/50")
      }
    >
      {/* Status toggle */}
      <button
        onClick={(e) => { e.stopPropagation(); void onToggle(task.id); }}
        className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
        title="ステータスを変更"
      >
        {task.status === "done" ? (
          <CheckCircle2 size={17} className="text-primary" />
        ) : task.status === "in_progress" ? (
          <Clock size={17} className="text-amber-500" />
        ) : (
          <Circle size={17} />
        )}
      </button>

      {/* Content */}
      <div className="flex flex-1 min-w-0 flex-col gap-0.5">
        <span
          className={
            "text-sm leading-snug truncate " +
            (task.status === "done" ? "line-through text-muted-foreground" : "")
          }
        >
          {task.text}
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          {task.due_date && (
            <span
              className={
                "flex items-center gap-1 text-[10px] " +
                (isOverdue ? "text-destructive font-medium" : "text-muted-foreground")
              }
            >
              <Calendar size={10} />
              {formatDate(task.due_date)}
            </span>
          )}
        </div>
      </div>

      {/* Status badge */}
      <StatusBadge status={task.status} />
    </div>
  );
}

// ── PersonalTaskDetail ────────────────────────────────────────
function PersonalTaskDetail({
  task, onEdit, onClose, onDelete,
}: {
  task:     PersonalTask;
  onEdit:   (t: PersonalTask) => void;
  onClose:  () => void;
  onDelete: (id: string) => Promise<void>;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const todayStr  = new Date().toISOString().split("T")[0];
  const isOverdue = task.due_date && task.due_date < todayStr && task.status !== "done";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold leading-snug">{task.text}</h3>
        <StatusBadge status={task.status} />
      </div>

      {task.description && (
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {task.description}
        </p>
      )}

      <dl className="flex flex-col gap-2.5 rounded-lg border bg-muted/30 p-3">
        <MetaRow icon={<Clock size={13} />} label="発行日時">
          <span className="text-xs text-muted-foreground">{formatDateTime(task.created_at)}</span>
        </MetaRow>
        {task.due_date && (
          <MetaRow icon={<Calendar size={13} />} label="期限">
            <span className={isOverdue ? "text-destructive font-medium" : ""}>
              {formatDate(task.due_date)}
              {isOverdue && "（期限切れ）"}
            </span>
          </MetaRow>
        )}
      </dl>

      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 rounded-lg border py-2 text-sm font-medium hover:bg-accent transition-colors"
        >
          閉じる
        </button>
        <button
          onClick={() => onEdit(task)}
          className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          編集
        </button>
      </div>

      {!confirmDelete ? (
        <button
          onClick={() => setConfirmDelete(true)}
          className="text-xs text-center text-muted-foreground hover:text-destructive transition-colors"
        >
          このタスクを削除
        </button>
      ) : (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex flex-col gap-2">
          <p className="text-xs text-destructive">本当に削除しますか？この操作は元に戻せません。</p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 rounded-md border py-1.5 text-xs font-medium hover:bg-accent transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={() => void onDelete(task.id)}
              className="flex-1 rounded-md bg-destructive py-1.5 text-xs font-medium text-destructive-foreground hover:opacity-90 transition-opacity"
            >
              削除する
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MetaRow({ icon, label, children }: {
  icon: React.ReactNode; label: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <dt className="flex items-center gap-1.5 text-muted-foreground w-20 shrink-0 text-xs pt-px">
        {icon}{label}
      </dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

// ── PersonalTaskForm ──────────────────────────────────────────
function PersonalTaskForm({
  mode, initialData, onSubmit, onCancel,
}: {
  mode:         "add" | "edit";
  initialData?: PersonalTask;
  onSubmit:     (data: PersonalTaskFormData, id?: string) => Promise<void>;
  onCancel:     () => void;
}) {
  const toFormData = (t?: PersonalTask): PersonalTaskFormData =>
    t
      ? { text: t.text, description: t.description ?? "", dueDate: t.due_date ?? "", status: t.status }
      : makeEmpty();

  const [form,       setForm]       = useState<PersonalTaskFormData>(() => toFormData(initialData));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm(toFormData(initialData));
  }, [initialData?.id, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof PersonalTaskFormData>(key: K, val: PersonalTaskFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.text.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(form, initialData?.id);
      if (mode === "add") setForm(makeEmpty());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col">
      {mode === "edit" && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">タスクを編集</h3>
          <button
            onClick={onCancel}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            追加モードに戻る
          </button>
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3">
        <FormField label="タスクタイトル" required>
          <input
            value={form.text}
            onChange={(e) => set("text", e.target.value)}
            placeholder="タスクのタイトルを入力"
            className="input-base"
            required
            autoFocus
          />
        </FormField>

        <FormField label="タスク詳細" icon={<AlignLeft size={13} />}>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="詳細・メモ（任意）"
            rows={2}
            className="input-base resize-none text-sm"
          />
        </FormField>

        <FormField label="期限" icon={<Calendar size={13} />}>
          <input
            type="date"
            value={form.dueDate}
            onChange={(e) => set("dueDate", e.target.value)}
            className="input-base"
          />
        </FormField>

        {mode === "edit" && (
          <FormField label="ステータス">
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value as TaskStatus)}
              className="input-base"
            >
              <option value="pending">待機中</option>
              <option value="in_progress">進行中</option>
              <option value="done">完了</option>
            </select>
          </FormField>
        )}

        <div className="flex gap-2 pt-2">
          {mode === "edit" && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg border py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              キャンセル
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 size={13} className="animate-spin" />}
            {mode === "add" ? "追加" : "保存"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── FormField ─────────────────────────────────────────────────
function FormField({
  label, required, icon, children,
}: {
  label:     string;
  required?: boolean;
  icon?:     React.ReactNode;
  children:  React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
        {required && <span className="text-destructive">*</span>}
      </label>
      {children}
    </div>
  );
}
