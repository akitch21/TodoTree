import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { flattenTasks } from "@/lib/taskTree";
import type { Task, TaskStatus } from "@/types";
import type { ProjectMember } from "@/components/project/MemberEditor";

// ── ProjectData type (exported for other modules) ──────────────────────────────

export interface ProjectData {
  id:           string;
  name:         string;
  description?: string;
  status:       "pending" | "in_progress" | "done";
  tasks:        Task[];
  members:      ProjectMember[];
  createdAt:    string;
}

// ── Helper: task completion stats ─────────────────────────────────────────────

export function projectStats(p: ProjectData): { total: number; done: number } {
  const flat = flattenTasks(p.tasks);
  return { total: flat.length, done: flat.filter((t) => t.status === "done").length };
}

// ── API shape ──────────────────────────────────────────────────────────────────

interface ApiMember {
  id: string;
  user_id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  role: "owner" | "admin" | "member";
}

interface ApiTask {
  id: string;
  parent_id: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  due_date: string | null;
  created_at: string;
  children: ApiTask[];
}

interface ApiProject {
  id: string;
  name: string;
  description: string;
  status: string;            // "active" | "completed" | "archived"
  tasks: ApiTask[];
  members: ApiMember[];
  created_at: string;
}

function apiTaskToTask(t: ApiTask): Task {
  return {
    id:          t.id,
    text:        t.title,
    description: t.description || undefined,
    status:      t.status,
    parentId:    t.parent_id,
    children:    (t.children ?? []).map(apiTaskToTask),
    createdAt:   t.created_at,
    dueDate:     t.due_date ?? undefined,
  };
}

// ── Status mapping ─────────────────────────────────────────────────────────────

function toFrontendStatus(s: string): ProjectData["status"] {
  if (s === "completed") return "done";
  if (s === "archived")  return "pending";
  return "in_progress";      // "active"
}

function toApiStatus(s: ProjectData["status"]): string {
  if (s === "done")    return "completed";
  if (s === "pending") return "archived";
  return "active";           // "in_progress"
}

function toProjectData(p: ApiProject): ProjectData {
  return {
    id:          p.id,
    name:        p.name,
    description: p.description,
    status:      toFrontendStatus(p.status),
    tasks:       (p.tasks ?? []).map(apiTaskToTask),
    members:     (p.members ?? []).map((m) => ({
      user: { id: m.user_id, name: m.user.name, email: m.user.email },
      role: m.role,
    })),
    createdAt:   p.created_at,
  };
}

// Suppress unused import warning for TaskStatus (used in ProjectData via Task)
export type { TaskStatus };

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useProjects() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get<ApiProject[]>("/api/projects/");
      setProjects(data.map(toProjectData));
    } catch {
      setError("プロジェクトの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const addProject = useCallback(async (name: string, description: string) => {
    const { data } = await api.post<ApiProject>("/api/projects/", {
      name, description, status: "active",
    });
    setProjects((prev) => [...prev, toProjectData(data)]);
  }, []);

  const updateProject = useCallback(async (
    id: string,
    patch: Partial<Pick<ProjectData, "status" | "name" | "description">>,
  ) => {
    const apiPatch: Record<string, string> = {};
    if (patch.status      !== undefined) apiPatch.status      = toApiStatus(patch.status);
    if (patch.name        !== undefined) apiPatch.name        = patch.name;
    if (patch.description !== undefined) apiPatch.description = patch.description;

    const { data } = await api.patch<ApiProject>(`/api/projects/${id}`, apiPatch);
    setProjects((prev) => prev.map((p) => p.id === id ? toProjectData(data) : p));
  }, []);

  return { projects, loading, error, addProject, updateProject, refetch: fetchProjects };
}
