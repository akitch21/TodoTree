import { useState, useEffect, useMemo, useCallback } from "react";
import { flattenTasks, makeEmptyForm } from "@/lib/taskTree";
import type { Reporter, Task, TaskFormData } from "@/types";

export interface UseTaskFormOptions {
  allTasks:     Task[];
  /** プロジェクトに参加しているメンバー（起票者・担当者の選択肢になる） */
  reporters:    Reporter[];
  initialData:  Partial<TaskFormData> & { id?: string; createdAt?: string };
  resetTrigger: unknown;
}

export function useTaskForm({
  allTasks,
  reporters,
  initialData,
  resetTrigger,
}: UseTaskFormOptions) {
  const [form, setForm]               = useState<TaskFormData>(() => makeEmptyForm(initialData));
  const [depQuery, setDepQuery]       = useState("");
  const [showDepDrop, setShowDepDrop] = useState(false);

  useEffect(() => {
    setForm(makeEmptyForm(initialData));
    setDepQuery("");
    setShowDepDrop(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetTrigger]);

  const flat     = useMemo(() => flattenTasks(allTasks), [allTasks]);
  const taskById = useMemo(() => new Map(flat.map((t) => [t.id, t])), [flat]);

  const parentOptions = useMemo(
    () => flat.filter((t) => t.id !== initialData.id),
    [flat, initialData.id]
  );

  const extraDepOptions = useMemo(
    () =>
      flat.filter(
        (t) =>
          t.id !== initialData.id &&
          t.id !== form.parentId &&
          !form.extraDependencies.includes(t.id) &&
          (depQuery === "" ||
            t.text.toLowerCase().includes(depQuery.toLowerCase()))
      ),
    [flat, initialData.id, form.parentId, form.extraDependencies, depQuery]
  );

  // 起票者・担当者ともプロジェクトメンバーから選択する。
  // ハードコード CURRENT_USER は注入しない。ログインユーザーが
  // メンバーに含まれている場合のみ「(自分)」表記が付く（呼び出し側で判定）。
  const reporterOptions = useMemo((): Reporter[] => reporters, [reporters]);
  const assigneeOptions = useMemo((): Reporter[] => reporters, [reporters]);

  const set = useCallback(
    <K extends keyof TaskFormData>(key: K, val: TaskFormData[K]) =>
      setForm((prev) => ({ ...prev, [key]: val })),
    []
  );

  const addDep = useCallback((id: string) => {
    setForm((prev) => ({
      ...prev,
      extraDependencies: [...prev.extraDependencies, id],
    }));
    setDepQuery("");
    setShowDepDrop(false);
  }, []);

  const removeDep = useCallback((id: string) => {
    setForm((prev) => ({
      ...prev,
      extraDependencies: prev.extraDependencies.filter((d) => d !== id),
    }));
  }, []);

  return {
    form, setForm,
    depQuery, setDepQuery,
    showDepDrop, setShowDepDrop,
    flat, taskById,
    parentOptions,
    extraDepOptions,
    reporterOptions,
    assigneeOptions,
    set,
    addDep,
    removeDep,
  };
}
