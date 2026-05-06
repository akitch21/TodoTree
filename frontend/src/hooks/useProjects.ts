import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/store/AuthContext";
import type { ProjectMember } from "@/components/project/MemberEditor";

// ── ProjectData type (exported for other modules) ──────────────────────────────

export interface ProjectData {
  id:            string;
  name:          string;
  description?:  string;
  status:        "pending" | "in_progress" | "done";
  task_count:    number;
  done_count:    number;
  overdue_count: number;
  members:       ProjectMember[];
  createdAt:     string;
}

// ── Helper: task completion stats ─────────────────────────────────────────────

export function projectStats(p: ProjectData): { total: number; done: number } {
  return { total: p.task_count, done: p.done_count };
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

interface ApiProjectListItem {
  id: string;
  name: string;
  description: string;
  status: string;            // "active" | "completed" | "archived"
  task_count: number;
  done_count: number;
  overdue_count: number;
  members: ApiMember[];
  created_at: string;
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

function toProjectData(p: ApiProjectListItem): ProjectData {
  return {
    id:            p.id,
    name:          p.name,
    description:   p.description,
    status:        toFrontendStatus(p.status),
    task_count:    p.task_count,
    done_count:    p.done_count,
    overdue_count: p.overdue_count,
    members:       (p.members ?? []).map((m) => ({
      user: { id: m.user_id, name: m.user.name, email: m.user.email },
      role: m.role,
    })),
    createdAt:     p.created_at,
  };
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useProjects() {
  const { token, user } = useAuth();
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    if (!token) {
      setProjects([]);
      setLoading(false);
      setError(null);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get<ApiProjectListItem[]>("/api/projects/");
      setProjects(data.map(toProjectData));
    } catch {
      setError("プロジェクトの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    setProjects([]);
    void fetchProjects();
  }, [fetchProjects, user?.id]);

  const addProject = useCallback(async (name: string, description: string) => {
    await api.post<ApiProjectListItem>("/api/projects/", {
      name, description, status: "active",
    });
    await fetchProjects();
  }, [fetchProjects]);

  const updateProject = useCallback(async (
    id: string,
    patch: Partial<Pick<ProjectData, "status" | "name" | "description">>,
  ) => {
    const apiPatch: Record<string, string> = {};
    if (patch.status      !== undefined) apiPatch.status      = toApiStatus(patch.status);
    if (patch.name        !== undefined) apiPatch.name        = patch.name;
    if (patch.description !== undefined) apiPatch.description = patch.description;

    const { data } = await api.patch<ApiProjectListItem>(`/api/projects/${id}`, apiPatch);
    setProjects((prev) => prev.map((p) => p.id === id ? toProjectData(data) : p));
  }, []);

  return { projects, loading, error, addProject, updateProject, refetch: fetchProjects };
}
