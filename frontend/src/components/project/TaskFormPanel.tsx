import { useRef, useEffect, useState } from "react";
import { Calendar, AlignLeft, UserCircle, UserCheck, RotateCcw } from "lucide-react";
import { useTaskForm } from "@/hooks/useTaskForm";
import { formatDateTime } from "@/lib/formatDate";
import { useAuth } from "@/store/AuthContext";
import { Field, DependencySection } from "@/components/project/TaskSidePanel";
import type { Reporter, Task, TaskFormData } from "@/types";

export interface TaskFormPanelProps {
  mode:         "create" | "edit";
  initialData:  Partial<TaskFormData> & { createdAt?: string; id?: string };
  allTasks:     Task[];
  reporters:    Reporter[];
  onSubmit:     (data: TaskFormData, id?: string) => void | Promise<void>;
  onCancelEdit: () => void;
}

export default function TaskFormPanel({
  mode, initialData, allTasks, reporters, onSubmit, onCancelEdit,
}: TaskFormPanelProps) {
  const titleRef    = useRef<HTMLInputElement>(null);
  const resetTrigger = mode + (initialData.id ?? "");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { user: authUser } = useAuth();

  const {
    form, setForm, set,
    depQuery, setDepQuery,
    showDepDrop, setShowDepDrop,
    taskById, parentOptions, extraDepOptions,
    reporterOptions, assigneeOptions,
    addDep, removeDep,
  } = useTaskForm({ allTasks, reporters, initialData, resetTrigger });

  useEffect(() => {
    titleRef.current?.focus();
  }, [resetTrigger]);

  const issuedAt = initialData.createdAt ?? new Date().toISOString();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.text.trim()) return;
    setSubmitError(null);
    try {
      await onSubmit(form, initialData.id);
      setForm({
        text: "", description: "", dueDate: "",
        parentId: null, extraDependencies: [],
        // 連続追加時は前回の起票者を保持（メンバー選択をやり直さなくて済む）
        reporter: form.reporter, assignee: null,
      });
      titleRef.current?.focus();
    } catch {
      setSubmitError("タスクの保存に失敗しました。入力内容を確認して再度お試しください。");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">
          {mode === "create" ? "タスクを追加" : "タスクを編集"}
        </h3>
        {mode === "edit" && (
          <button onClick={onCancelEdit}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw size={12} />
            追加モードに戻る
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
        {submitError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {submitError}
          </div>
        )}

        {/* タスクタイトル */}
        <Field label="タスクタイトル" required>
          <input
            ref={titleRef}
            value={form.text}
            onChange={(e) => set("text", e.target.value)}
            placeholder="タスクのタイトルを入力"
            className="input-base"
            required
          />
        </Field>

        {/* タスク詳細 */}
        <Field label="タスク詳細" icon={<AlignLeft size={13} />}>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="詳細・メモ（任意）"
            rows={2}
            className="input-base resize-none text-sm"
          />
        </Field>

        {/* 起票者 — プロジェクトメンバーから選択 */}
        <Field label="起票者" icon={<UserCircle size={13} />} required>
          {reporterOptions.length === 0 ? (
            <p className="rounded-md border border-amber-300/50 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
              起票者を選択するには、プロジェクトにメンバーを追加してください。
            </p>
          ) : (
            <select
              value={form.reporter?.id ?? ""}
              onChange={(e) => {
                const found = reporterOptions.find((r) => r.id === e.target.value);
                set("reporter", found ?? null);
              }}
              className="input-base"
              required
            >
              {!form.reporter && <option value="">選択してください</option>}
              {reporterOptions.map((r) => (
                <option key={r.id} value={r.id}>
                  {authUser && r.id === authUser.id ? r.name + "（自分）" : r.name}
                </option>
              ))}
            </select>
          )}
        </Field>

        {/* 担当者 */}
        <Field label="担当者" icon={<UserCheck size={13} />}>
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
            className="input-base"
          >
            <option value="">担当者なし</option>
            {assigneeOptions.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </Field>

        {/* 期限 */}
        <Field label="期限" icon={<Calendar size={13} />}>
          <input
            type="date"
            value={form.dueDate}
            onChange={(e) => set("dueDate", e.target.value)}
            className="input-base"
          />
        </Field>

        {/* 発行日時 */}
        <Field label="発行日時" icon={<Calendar size={13} />}>
          <div className="input-base cursor-default select-none bg-muted/40 text-muted-foreground text-sm">
            {formatDateTime(issuedAt)}
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
          dropMaxH="max-h-36" dropMaxItems={6}
        />

        {/* Submit */}
        <div className="flex gap-2 pt-1">
          {mode === "edit" && (
            <button type="button" onClick={onCancelEdit}
              className="flex-1 rounded-lg border py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              キャンセル
            </button>
          )}
          <button type="submit"
            className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {mode === "create" ? "追加" : "保存"}
          </button>
        </div>
      </form>
    </div>
  );
}
