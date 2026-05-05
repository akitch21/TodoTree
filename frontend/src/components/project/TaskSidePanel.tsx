import { useState, useEffect, useRef } from "react";
import { X, Plus, Calendar, AlignLeft, Link2, GitBranch, UserCircle, UserCheck } from "lucide-react";
import { useTaskForm } from "@/hooks/useTaskForm";
import { formatDateTime } from "@/lib/formatDate";
import { CURRENT_USER } from "@/lib/currentUser";
import type { Reporter, Task, TaskFormData } from "@/types";

// ── Props ─────────────────────────────────────────────────────
interface TaskSidePanelProps {
  open:        boolean;
  onClose:     () => void;
  mode:        "create" | "edit";
  initialData?: Partial<TaskFormData> & { createdAt?: string; id?: string };
  allTasks:    Task[];
  reporters:   Reporter[];
  onSubmit:    (data: TaskFormData, id?: string) => void | Promise<void>;
}

// ── Component ─────────────────────────────────────────────────
export default function TaskSidePanel({
  open,
  onClose,
  mode,
  initialData = {},
  allTasks,
  reporters,
  onSubmit,
}: TaskSidePanelProps) {
  const firstInputRef = useRef<HTMLInputElement>(null);
  const [issuedAt]    = useState(() => new Date().toISOString());
  const [submitError, setSubmitError] = useState<string | null>(null);

  const displayIssuedAt =
    mode === "edit" && initialData.createdAt ? initialData.createdAt : issuedAt;

  const {
    form, set,
    depQuery, setDepQuery,
    showDepDrop, setShowDepDrop,
    taskById, parentOptions, extraDepOptions,
    reporterOptions, assigneeOptions,
    addDep, removeDep,
  } = useTaskForm({ allTasks, reporters, initialData, resetTrigger: open });

  useEffect(() => {
    if (open) setTimeout(() => firstInputRef.current?.focus(), 80);
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.text.trim()) return;
    setSubmitError(null);
    try {
      await onSubmit(form, initialData.id);
      onClose();
    } catch {
      setSubmitError("タスクの保存に失敗しました。入力内容を確認して再度お試しください。");
    }
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
          onClick={onClose}
        />
      )}

      <div
        className={
          "fixed inset-y-0 right-0 z-50 flex w-[420px] max-w-full flex-col border-l bg-card shadow-2xl transition-transform duration-300 " +
          (open ? "translate-x-0" : "translate-x-full")
        }
      >
        {/* Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b px-5">
          <h2 className="text-sm font-semibold">
            {mode === "create" ? "タスクを追加" : "タスクを編集"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable form */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex flex-col gap-5 px-5 py-6">
            {submitError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {submitError}
              </div>
            )}

            {/* タスクタイトル */}
            <Field label="タスクタイトル" required>
              <input
                ref={firstInputRef}
                data-testid="task-title-input"
                value={form.text}
                onChange={(e) => set("text", e.target.value)}
                placeholder="タスクのタイトルを入力"
                className="input-base"
                required
              />
            </Field>

            {/* タスク詳細 */}
            <Field label="タスク詳細" icon={<AlignLeft size={14} />}>
              <textarea
                data-testid="task-description-input"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="詳細・メモを入力（任意）"
                rows={3}
                className="input-base resize-none"
              />
            </Field>

            {/* 起票者 */}
            <Field label="起票者" icon={<UserCircle size={14} />} required>
              <div className="flex flex-col gap-2">
                <select
                  value={form.reporter.id}
                  onChange={(e) => {
                    const found = reporterOptions.find((r) => r.id === e.target.value);
                    if (found) set("reporter", found);
                  }}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                >
                  {reporterOptions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.id === CURRENT_USER.id ? r.name + "（自分）" : r.name}
                    </option>
                  ))}
                </select>
                {form.reporter.id === CURRENT_USER.id && (
                  <p className="text-xs text-muted-foreground">
                    デフォルトは自分です。変更する場合はプロジェクトメンバーから選択してください。
                  </p>
                )}
              </div>
            </Field>

            {/* 担当者 */}
            <Field label="担当者" icon={<UserCheck size={14} />}>
              <select
                value={form.assignee?.id ?? ""}
                onChange={(e) => {
                  if (!e.target.value) {
                    set("assignee", null);
                  } else {
                    const found = assigneeOptions.find((r) => r.id === e.target.value);
                    if (found) set("assignee", found);
                  }
                }}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">担当者なし</option>
                {assigneeOptions.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </Field>

            {/* 期限 */}
            <Field label="期限" icon={<Calendar size={14} />}>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => set("dueDate", e.target.value)}
                className="input-base"
              />
            </Field>

            {/* 発行日時（自動） */}
            <Field label="発行日時" icon={<Calendar size={14} />}>
              <div className="input-base cursor-default select-none bg-muted/40 text-muted-foreground">
                {formatDateTime(displayIssuedAt)}
              </div>
            </Field>

            {/* 依存関係 */}
            <DependencySection
              form={form} set={set}
              taskById={taskById} parentOptions={parentOptions}
              extraDepOptions={extraDepOptions}
              depQuery={depQuery} setDepQuery={setDepQuery}
              showDepDrop={showDepDrop} setShowDepDrop={setShowDepDrop}
              addDep={addDep} removeDep={removeDep}
              dropMaxH="max-h-40" dropMaxItems={8}
            />
          </div>

          {/* Footer */}
          <div className="mt-auto flex shrink-0 items-center justify-end gap-2 border-t px-5 py-4">
            <button
              type="button" onClick={onClose}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              data-testid="task-save-submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              {mode === "create" ? "追加" : "保存"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ── Field wrapper ─────────────────────────────────────────────
export function Field({
  label, required, icon, children,
}: {
  label: string; required?: boolean; icon?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-sm font-medium">
        {icon}{label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

// ── Shared dependency section ─────────────────────────────────
export function DependencySection({
  form, set, taskById, parentOptions, extraDepOptions,
  depQuery, setDepQuery, showDepDrop, setShowDepDrop,
  addDep, removeDep, dropMaxH = "max-h-40", dropMaxItems = 8,
}: {
  form:            TaskFormData;
  set:             <K extends keyof TaskFormData>(key: K, val: TaskFormData[K]) => void;
  taskById:        Map<string, Task>;
  parentOptions:   Task[];
  extraDepOptions: Task[];
  depQuery:        string;
  setDepQuery:     (v: string) => void;
  showDepDrop:     boolean;
  setShowDepDrop:  (v: boolean) => void;
  addDep:          (id: string) => void;
  removeDep:       (id: string) => void;
  dropMaxH?:       string;
  dropMaxItems?:   number;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5 text-sm font-medium">
        <GitBranch size={14} className="text-muted-foreground" />
        依存関係
      </div>

      {/* 親タスク */}
      <div className="rounded-lg border bg-background p-3 flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground">
          親タスク
          <span className="ml-1 text-[10px] text-muted-foreground/70">（ツリーで実線として表示）</span>
        </p>
        <select
          value={form.parentId ?? ""}
          onChange={(e) => set("parentId", e.target.value || null)}
          className="w-full rounded-md border bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">なし（ルートタスク）</option>
          {parentOptions.map((t) => (
            <option key={t.id} value={t.id}>{t.text}</option>
          ))}
        </select>
      </div>

      {/* 追加の依存先 */}
      <div className="rounded-lg border bg-background p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">
            追加の依存先
            <span className="ml-1 text-[10px] text-muted-foreground/70">（任意・複数可）</span>
          </p>
          <span className="text-[10px] text-primary/80">ツリーで点線として表示</span>
        </div>

        {form.extraDependencies.length > 0 && (
          <ul className="flex flex-col gap-1">
            {form.extraDependencies.map((depId) => {
              const dep = taskById.get(depId);
              return (
                <li key={depId}
                  className="flex items-center justify-between rounded-md bg-primary/10 px-2.5 py-1.5"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Link2 size={12} className="text-primary shrink-0" />
                    <span className="truncate text-xs">{dep?.text ?? depId}</span>
                  </div>
                  <button type="button" onClick={() => removeDep(depId)}
                    className="ml-2 shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive"
                  >
                    <X size={12} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="relative">
          <div className="flex gap-1.5">
            <input
              value={depQuery}
              onChange={(e) => { setDepQuery(e.target.value); setShowDepDrop(true); }}
              onFocus={() => setShowDepDrop(true)}
              onBlur={() => setTimeout(() => setShowDepDrop(false), 150)}
              placeholder="タスク名で検索..."
              className="input-base flex-1 text-xs py-1.5"
            />
            <button type="button" disabled={!depQuery.trim()}
              className="flex items-center gap-1 rounded-md bg-muted px-2 py-1.5 text-xs hover:bg-accent disabled:opacity-40 transition-colors"
            >
              <Plus size={11} />
            </button>
          </div>

          {showDepDrop && extraDepOptions.length > 0 && (
            <ul className={"absolute z-10 mt-1 w-full overflow-y-auto rounded-lg border bg-popover shadow-lg " + dropMaxH}>
              {extraDepOptions.slice(0, dropMaxItems).map((t) => (
                <li key={t.id}>
                  <button type="button" onMouseDown={() => addDep(t.id)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-accent text-left"
                  >
                    <Link2 size={11} className="shrink-0 text-muted-foreground" />
                    {t.text}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
