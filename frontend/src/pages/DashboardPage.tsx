import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle, AlertCircle, Calendar, CheckCircle2, Circle,
  Clock, FolderOpen, Loader2, UserCheck, Zap,
} from "lucide-react";
import { StatCard }              from "@/components/dashboard/StatCard";
import { TaskPanel, type ViewMode } from "@/components/dashboard/TaskPanel";
import { StatusBadge }           from "@/components/dashboard/StatusBadge";
import { useAuth }               from "@/store/AuthContext";
import { useProjects }           from "@/hooks/useProjects";
import { updateTaskInTree }      from "@/lib/taskTree";
import { api }                   from "@/lib/api";
import type { Task, TaskStatus } from "@/types";

// ── API shape for project detail (tasks included) ──────────────────────────────
interface ApiTaskNode {
  id: string;
  parent_id: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  due_date: string | null;
  created_at: string;
  children: ApiTaskNode[];
}

function apiTaskToTask(t: ApiTaskNode): Task {
  return {
    id:          t.id,
    text:        t.title,
    description: t.description || undefined,
    status:      t.status,
    parentId:    t.parent_id,
    children:    (t.children ?? []).map(apiTaskToTask),
    createdAt:   t.created_at,
    dueDate:     t.due_date ?? undefined,
    // assignee resolved in project detail page; omit here to avoid stale data
  };
}

// ── Page ──────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user }    = useAuth();
  const { projects: apiProjects, loading, error } = useProjects();

  const projectTabList = useMemo(
    () => apiProjects.filter((p) => p.status !== "done").map((p) => ({ id: p.id, name: p.name })),
    [apiProjects]
  );

  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [viewMode,          setViewMode]           = useState<ViewMode>("tree");

  // Lazy-loaded task cache: { projectId → Task[] }
  const [taskCache,     setTaskCache]     = useState<Record<string, Task[]>>({});
  const [taskLoading,   setTaskLoading]   = useState(false);
  const [localTasks,    setLocalTasks]    = useState<Record<string, Task[]>>({});
  const [mutationError, setMutationError] = useState<string | null>(null);

  // Effective project ID
  const activeProjectId = selectedProjectId || projectTabList[0]?.id || "";

  // Fetch task tree for selected project (once per project, cached)
  const fetchingRef = useRef<string | null>(null);
  useEffect(() => {
    if (!activeProjectId) return;
    if (taskCache[activeProjectId] !== undefined) return;
    if (fetchingRef.current === activeProjectId) return;
    fetchingRef.current = activeProjectId;
    setTaskLoading(true);
    api.get<{ tasks: ApiTaskNode[] }>(`/api/projects/${activeProjectId}`)
      .then(({ data }) => {
        setTaskCache((prev) => ({ ...prev, [activeProjectId]: data.tasks.map(apiTaskToTask) }));
      })
      .catch(() => {
        setTaskCache((prev) => ({ ...prev, [activeProjectId]: [] }));
      })
      .finally(() => {
        setTaskLoading(false);
        fetchingRef.current = null;
      });
  }, [activeProjectId, taskCache]);

  // Effective tasks for the panel: localOverride > cache
  const currentTasks = useMemo<Task[]>(() => {
    if (localTasks[activeProjectId]) return localTasks[activeProjectId];
    return taskCache[activeProjectId] ?? [];
  }, [activeProjectId, localTasks, taskCache]);

  const toggleTask = useCallback((taskId: string) => {
    if (!activeProjectId) return;
    const base = currentTasks;
    const current = base.flatMap(function flatten(t: Task): Task[] {
      return [t, ...t.children.flatMap(flatten)];
    }).find((t) => t.id === taskId)?.status;
    if (!current) return;

    const newStatus: TaskStatus = current === "done" ? "pending" : "done";
    setMutationError(null);
    setLocalTasks((prev) => ({
      ...prev, [activeProjectId]: updateTaskInTree(base, taskId, { status: newStatus }),
    }));
    api.patch(`/api/tasks/${taskId}`, { status: newStatus }).catch(() => {
      setLocalTasks((latest) => ({ ...latest, [activeProjectId]: base }));
      setMutationError("ステータス更新に失敗しました。変更を元に戻しました。");
    });
  }, [activeProjectId, currentTasks]);

  const handleStatusChange = useCallback((taskId: string, status: TaskStatus) => {
    if (!activeProjectId) return;
    const base = currentTasks;
    setMutationError(null);
    setLocalTasks((prev) => ({
      ...prev, [activeProjectId]: updateTaskInTree(base, taskId, { status }),
    }));
    api.patch(`/api/tasks/${taskId}`, { status }).catch(() => {
      setLocalTasks((latest) => ({ ...latest, [activeProjectId]: base }));
      setMutationError("ステータス更新に失敗しました。変更を元に戻しました。");
    });
  }, [activeProjectId, currentTasks]);

  // ── Aggregate stats from API counts ───────────────────────────
  const { totalTasks, totalDone, totalOverdue, projects } = useMemo(() => {
    let tasks = 0, done = 0, overdue = 0;
    const projs = apiProjects.map((p) => {
      tasks   += p.task_count;
      done    += p.done_count;
      overdue += p.overdue_count;
      const pct = p.task_count > 0 ? Math.round((p.done_count / p.task_count) * 100) : 0;
      return { id: p.id, name: p.name, status: p.status, total: p.task_count, done: p.done_count, pct, overdue: p.overdue_count };
    });
    return { totalTasks: tasks, totalDone: done, totalOverdue: overdue, projects: projs };
  }, [apiProjects]);

  const totalActive  = totalTasks - totalDone;
  const progressPct  = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;

  // Projects with overdue tasks (for the overdue section)
  const overdueProjects = useMemo(
    () => projects.filter((p) => p.overdue > 0),
    [projects]
  );

  // Greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "おはようございます" :
    hour < 18 ? "こんにちは" : "お疲れさまです";

  const todayLabel = new Date().toLocaleDateString("ja-JP", {
    year: "numeric", month: "long", day: "numeric", weekday: "short",
  });

  // ── Loading / Error ────────────────────────────────────────
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
    <div className="flex flex-col gap-4 pb-8 md:gap-6">

      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{todayLabel}</p>
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting}、{user?.name ?? "ゲスト"} さん
          </h1>
        </div>
        {totalOverdue > 0 && (
          <div className="flex w-fit items-center gap-1.5 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-1.5 text-xs font-medium text-destructive">
            <AlertTriangle size={13} />
            期限切れタスクが {totalOverdue} 件あります
          </div>
        )}
      </div>

      {mutationError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <AlertCircle size={15} />
          <span>{mutationError}</span>
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid shrink-0 grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <StatCard
          label="アクティブタスク"
          value={totalActive}
          icon={<Circle size={16} className="text-muted-foreground" />}
        />
        <StatCard
          label="完了タスク"
          value={totalDone}
          icon={<CheckCircle2 size={16} className="text-primary" />}
        />
        <StatCard
          label="期限切れ"
          value={totalOverdue}
          icon={<AlertTriangle size={16} className={totalOverdue > 0 ? "text-destructive" : "text-muted-foreground"} />}
          variant={totalOverdue > 0 ? "danger" : "default"}
        />
        <StatCard
          label="全体進捗"
          value={progressPct + "%"}
          progress={progressPct}
          icon={<Zap size={16} className="text-amber-500" />}
        />
      </div>

      {/* ── Main 2-column grid ── */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Left col (2/3) */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* 期限切れタスク（プロジェクト単位） */}
          <Section
            title="期限切れタスクのあるプロジェクト"
            icon={<Calendar size={15} className="text-destructive" />}
            count={overdueProjects.length}
            emptyText="期限切れタスクはありません"
          >
            {overdueProjects.map((p) => (
              <Link
                key={p.id}
                to={"/projects/" + p.id}
                className="flex flex-col gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3 hover:bg-destructive/10 transition-colors"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0 text-destructive" />
                  <span className="min-w-0 truncate text-sm font-medium">{p.name}</span>
                </div>
                <span className="shrink-0 pl-5 text-xs font-medium text-destructive sm:pl-0">
                  <Clock size={11} className="inline mr-1" />
                  期限切れ {p.overdue} 件
                </span>
              </Link>
            ))}
          </Section>

          {/* 担当タスク */}
          <Section
            title="担当タスク"
            icon={<UserCheck size={15} className="text-primary" />}
            count={0}
            emptyText="API で担当者を設定したタスクがここに表示されます"
          >
            {[]}
          </Section>
        </div>

        {/* Right col (1/3) */}
        <div className="flex flex-col gap-6">

          {/* プロジェクト進捗 */}
          <Section
            title="プロジェクト進捗"
            icon={<FolderOpen size={15} className="text-muted-foreground" />}
          >
            {projects.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                プロジェクトがありません
              </p>
            ) : projects.map((p) => (
              <Link
                key={p.id}
                to={"/projects/" + p.id}
                className="flex flex-col gap-2 rounded-lg border bg-card px-3 py-2.5 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{p.name}</span>
                  <StatusBadge status={p.status} />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-secondary">
                    <div
                      className="h-1.5 rounded-full bg-primary transition-all duration-500"
                      style={{ width: p.pct + "%" }}
                    />
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground w-14 text-right">
                    {p.done}/{p.total} · {p.pct}%
                  </span>
                </div>
              </Link>
            ))}
          </Section>
        </div>
      </div>

      {/* ── Project TaskPanel with switcher ── */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
        {/* Header row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FolderOpen size={15} className="text-muted-foreground" />
            <span className="text-sm font-semibold">プロジェクト タスクビュー</span>
          </div>
          {activeProjectId && (
            <Link
              to={"/projects/" + activeProjectId}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              詳細を開く →
            </Link>
          )}
        </div>

        {/* Project dropdown */}
        {projectTabList.length > 0 ? (
          <div className="flex items-center gap-2">
            <FolderOpen size={13} className="shrink-0 text-muted-foreground" />
            <select
              value={activeProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setViewMode("tree");
              }}
              className="flex-1 rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
            >
              {projectTabList.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-2">
            アクティブなプロジェクトがありません
          </p>
        )}

        {/* Task panel — lazy-loaded */}
        {taskLoading && !taskCache[activeProjectId] ? (
          <div className="flex h-40 items-center justify-center gap-2 text-muted-foreground">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">タスクを読み込み中...</span>
          </div>
        ) : (
          <TaskPanel
            key={activeProjectId}
            tasks={currentTasks}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onToggle={toggleTask}
            onStatusChange={handleStatusChange}
            projectName={projectTabList.find((p) => p.id === activeProjectId)?.name ?? ""}
          />
        )}
      </div>
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────
function Section({
  title, icon, count, emptyText, children,
}: {
  title:      string;
  icon:       React.ReactNode;
  count?:     number;
  emptyText?: string;
  children:   React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-semibold">{title}</h2>
        {count !== undefined && count > 0 && (
          <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      {count === 0 && emptyText ? (
        <p className="py-4 text-center text-xs text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="flex flex-col gap-2">{children}</div>
      )}
    </div>
  );
}
