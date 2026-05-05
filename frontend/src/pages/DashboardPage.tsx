import { useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle, AlertCircle, Calendar, CheckCircle2, Circle,
  Clock, FolderOpen, Loader2, UserCheck, Zap,
} from "lucide-react";
import { StatCard }              from "@/components/dashboard/StatCard";
import { TaskPanel, type ViewMode } from "@/components/dashboard/TaskPanel";
import { StatusBadge }           from "@/components/dashboard/StatusBadge";
import { formatDate }            from "@/lib/formatDate";
import { useAuth }               from "@/store/AuthContext";
import { useProjects }           from "@/hooks/useProjects";
import { flattenTasks, updateTaskInTree } from "@/lib/taskTree";
import { api }                   from "@/lib/api";
import type { Task, TaskStatus } from "@/types";

// ── Types ─────────────────────────────────────────────────────
interface FlatTask {
  id:            string;
  text:          string;
  status:        TaskStatus;
  dueDate?:      string;
  assigneeId?:   string;
  assigneeName?: string;
  projectId:     string;
  projectName:   string;
}

interface ProjectSummary {
  id:     string;
  name:   string;
  status: TaskStatus;
  total:  number;
  done:   number;
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
  const [localTasks,        setLocalTasks]         = useState<Record<string, Task[]>>({});
  const [mutationError,     setMutationError]      = useState<string | null>(null);

  // 実効 projectId（state が未設定なら先頭を使う）
  const activeProjectId = selectedProjectId || projectTabList[0]?.id || "";

  // タスクは API のもの OR ローカルオーバーライドを優先
  const currentTasks = useMemo(() => {
    if (localTasks[activeProjectId]) return localTasks[activeProjectId];
    return apiProjects.find((p) => p.id === activeProjectId)?.tasks ?? [];
  }, [apiProjects, activeProjectId, localTasks]);

  const toggleTask = useCallback((taskId: string) => {
    if (!activeProjectId) return;
    const base = currentTasks;
    const current = flattenTasks(base).find((t) => t.id === taskId)?.status;
    if (!current) return;

    const newStatus: TaskStatus = current === "done" ? "pending" : "done";
    setMutationError(null);
    setLocalTasks((prev) => {
      return { ...prev, [activeProjectId]: updateTaskInTree(base, taskId, { status: newStatus }) };
    });
    api.patch(`/api/tasks/${taskId}`, { status: newStatus }).catch(() => {
      setLocalTasks((latest) => ({ ...latest, [activeProjectId]: base }));
      setMutationError("ステータス更新に失敗しました。変更を元に戻しました。");
    });
  }, [activeProjectId, currentTasks]);

  const handleStatusChange = useCallback((taskId: string, status: TaskStatus) => {
    if (!activeProjectId) return;
    const base = currentTasks;
    setMutationError(null);
    setLocalTasks((prev) => {
      return { ...prev, [activeProjectId]: updateTaskInTree(base, taskId, { status }) };
    });
    api.patch(`/api/tasks/${taskId}`, { status }).catch(() => {
      setLocalTasks((latest) => ({ ...latest, [activeProjectId]: base }));
      setMutationError("ステータス更新に失敗しました。変更を元に戻しました。");
    });
  }, [activeProjectId, currentTasks]);

  // Derived cross-project data
  const { flatTasks, projects } = useMemo(() => {
    const flat: FlatTask[] = [];
    const projs: ProjectSummary[] = [];
    for (const p of apiProjects) {
      const allTasks = flattenTasks(p.tasks);
      let done = 0;
      for (const t of allTasks) {
        flat.push({
          id:           t.id,
          text:         t.text,
          status:       t.status,
          dueDate:      t.dueDate,
          assigneeId:   t.assignee?.id,
          assigneeName: t.assignee?.name,
          projectId:    p.id,
          projectName:  p.name,
        });
        if (t.status === "done") done++;
      }
      projs.push({ id: p.id, name: p.name, status: p.status, total: allTasks.length, done });
    }
    return { flatTasks: flat, projects: projs };
  }, [apiProjects]);

  const todayStr = new Date().toISOString().split("T")[0];

  const overdueAndToday = useMemo(
    () => flatTasks.filter(
      (t) => t.status !== "done" && t.dueDate && t.dueDate <= todayStr
    ).sort((a, b) => (a.dueDate ?? "") < (b.dueDate ?? "") ? -1 : 1),
    [flatTasks, todayStr]
  );

  // Stats
  const totalActive  = flatTasks.filter((t) => t.status !== "done").length;
  const totalDone    = flatTasks.filter((t) => t.status === "done").length;
  const overdueCount = flatTasks.filter(
    (t) => t.status !== "done" && t.dueDate && t.dueDate < todayStr
  ).length;
  const progressPct = flatTasks.length > 0
    ? Math.round((totalDone / flatTasks.length) * 100)
    : 0;

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
        {overdueCount > 0 && (
          <div className="flex w-fit items-center gap-1.5 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-1.5 text-xs font-medium text-destructive">
            <AlertTriangle size={13} />
            期限切れタスクが {overdueCount} 件あります
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
          value={overdueCount}
          icon={<AlertTriangle size={16} className={overdueCount > 0 ? "text-destructive" : "text-muted-foreground"} />}
          variant={overdueCount > 0 ? "danger" : "default"}
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

          {/* 期限切れ・今日期限タスク */}
          <Section
            title="期限切れ・今日期限のタスク"
            icon={<Calendar size={15} className="text-destructive" />}
            count={overdueAndToday.length}
            emptyText="期限切れ・今日期限のタスクはありません"
          >
            {overdueAndToday.map((t) => {
              const isOverdue = t.dueDate! < todayStr;
              return (
                <div
                  key={t.id}
                  className={
                    "flex flex-col gap-1.5 rounded-lg border px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3 " +
                    (isOverdue
                      ? "border-destructive/30 bg-destructive/5"
                      : "border-amber-400/30 bg-amber-400/5")
                  }
                >
                  {/* アイコン + タスク名 */}
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    {isOverdue
                      ? <AlertTriangle size={14} className="shrink-0 text-destructive" />
                      : <Clock size={14} className="shrink-0 text-amber-500" />}
                    <span className="min-w-0 truncate text-sm font-medium">
                      {t.text}
                    </span>
                  </div>
                  {/* バッジ + 日付（モバイルは下段、デスクトップは右） */}
                  <div className="flex items-center gap-2 pl-5 sm:pl-0">
                    <ProjectBadge name={t.projectName} id={t.projectId} />
                    <span
                      className={
                        "shrink-0 text-xs font-medium " +
                        (isOverdue ? "text-destructive" : "text-amber-600")
                      }
                    >
                      {isOverdue ? "期限切れ" : "今日"} · {formatDate(t.dueDate)}
                    </span>
                  </div>
                </div>
              );
            })}
          </Section>

          {/* 担当タスクはダッシュボードでは省略（API に assignee が未実装のため） */}
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
            ) : projects.map((p) => {
              const pct = p.total > 0 ? Math.round((p.done / p.total) * 100) : 0;
              return (
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
                        style={{ width: pct + "%" }}
                      />
                    </div>
                    <span className="shrink-0 text-[10px] text-muted-foreground w-14 text-right">
                      {p.done}/{p.total} · {pct}%
                    </span>
                  </div>
                </Link>
              );
            })}
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

        {/* Task panel */}
        <TaskPanel
          key={activeProjectId}
          tasks={currentTasks}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onToggle={toggleTask}
          onStatusChange={handleStatusChange}
          projectName={projectTabList.find((p) => p.id === activeProjectId)?.name ?? ""}
        />
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

// ── ProjectBadge ──────────────────────────────────────────────
function ProjectBadge({ name, id }: { name: string; id: string }) {
  return (
    <Link
      to={"/projects/" + id}
      onClick={(e) => e.stopPropagation()}
      className="flex shrink-0 items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
    >
      <FolderOpen size={9} />
      {name}
    </Link>
  );
}
