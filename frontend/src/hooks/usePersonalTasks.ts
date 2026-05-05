import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { TaskStatus } from "@/types";

// ── API shape ──────────────────────────────────────────────────────────────────

export interface PersonalTask {
  id:          string;
  user_id:     string;
  text:        string;
  description: string;
  status:      TaskStatus;
  due_date:    string | null;
  project_ref: string | null;
  created_at:  string;
  updated_at:  string;
}

export interface PersonalTaskCreateData {
  text:        string;
  description?: string;
  status?:     TaskStatus;
  due_date?:   string | null;
  project_ref?: string | null;
}

export interface PersonalTaskUpdateData {
  text?:        string;
  description?: string;
  status?:      TaskStatus;
  due_date?:    string | null;
  project_ref?: string | null;
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function usePersonalTasks() {
  const [tasks,   setTasks]   = useState<PersonalTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get<PersonalTask[]>("/api/personal-tasks/");
      setTasks(data);
    } catch {
      setError("個人タスクの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const addTask = useCallback(async (input: PersonalTaskCreateData): Promise<PersonalTask> => {
    const { data } = await api.post<PersonalTask>("/api/personal-tasks/", input);
    setTasks((prev) => [data, ...prev]);
    return data;
  }, []);

  const updateTask = useCallback(async (id: string, patch: PersonalTaskUpdateData): Promise<void> => {
    const { data } = await api.patch<PersonalTask>(`/api/personal-tasks/${id}`, patch);
    setTasks((prev) => prev.map((t) => (t.id === id ? data : t)));
  }, []);

  const deleteTask = useCallback(async (id: string): Promise<void> => {
    await api.delete(`/api/personal-tasks/${id}`);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { tasks, loading, error, addTask, updateTask, deleteTask, refetch: fetchTasks };
}
