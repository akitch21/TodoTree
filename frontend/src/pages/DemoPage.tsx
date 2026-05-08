import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Circle,
  FolderOpen, GitBranch, Info, LayoutDashboard, Sparkles, Zap,
} from "lucide-react";
import { StatCard }              from "@/components/dashboard/StatCard";
import { TaskPanel, type ViewMode } from "@/components/dashboard/TaskPanel";
import { StatusBadge }           from "@/components/dashboard/StatusBadge";
import { AnnouncementsCard }     from "@/components/dashboard/AnnouncementsCard";
import { flattenTasks, updateTaskInTree } from "@/lib/taskTree";
import { DEMO_PROJECTS } from "@/lib/demoData";
import { cn } from "@/lib/utils";
import type { Project, Task, TaskStatus } from "@/types";

type DemoTab = "dashboard" | "project";

/**
 * /demo — ログイン不要のデモ画面。
 * メモリ内でのみ動作する（リロードで初期値に戻る）。
 */
export default function DemoPage() {
  // 全プロジェクトをローカル state に保持（CRUDはここで完結）
  const [projects, setProjects] = useState<Project[]>(() =>
    structuredClone(DEMO_PROJECTS),
  );

  const [tab, setTab]                       = useState<DemoTab>("dashboard");
  const [activeProjectId, setActiveProjectId] = useState<string>(
    DEMO_PROJECTS[0]?.id ?? "",
  );
  const [viewMode, setViewMode] = useState<ViewMode>("tree");

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? null,
    [projects, activeProjectId],
  );

  // ── 集計 ──────────────────────────────────────────────────────
  const aggregate = useMemo(() => {
    let totalTasks = 0;
    let totalDone  = 0;
    let totalOverdue = 0;
    const todayStr = new Date().toISOString().slice(0, 10);

    const projStats = projects.map((p) => {
      const flat = flattenTasks(p.tasks);
      const done    = flat.filter((t) => t.status === "done").length;
      const overdue = flat.filter(
        (t) => t.status !== "done" && t.dueDate && t.dueDate < todayStr,
      ).length;
      totalTasks   += flat.length;
      totalDone    += done;
      totalOverdue += overdue;
      const pct = flat.length > 0 ? Math.round((done / flat.length) * 100) : 0;
      return {
        id: p.id, name: p.name, total: flat.length, done, pct, overdue,
      };
    });

    const totalActive = totalTasks - totalDone;
    const progressPct = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;
    const overdueProjects = projStats.filter((p) => p.overdue > 0);

    return { totalTasks, totalDone, totalOverdue, totalActive, progressPct, projStats, overdueProjects };
  }, [projects]);

  // ── タスク更新ハンドラ（メモリのみ） ───────────────────────────
  const updateTaskStatus = useCallback(
    (projectId: string, taskId: string, status: TaskStatus) => {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? { ...p, tasks: updateTaskInTree(p.tasks, taskId, { status }) }
            : p,
        ),
      );
    },
    [],
  );

  const toggleTaskInActive = useCallback(
    (taskId: string) => {
      if (!activeProject) return;
      const flat = flattenTasks(activeProject.tasks);
      const cur  = flat.find((t) => t.id === taskId);
      if (!cur) return;
      const next: TaskStatus = cur.status === "done" ? "pending" : "done";
      updateTaskStatus(activeProject.id, taskId, next);
    },
    [activeProject, updateTaskStatus],
  );

  const handleStatusChange = useCallback(
    (taskId: string, status: TaskStatus) => {
      if (!activeProject) return;
      updateTaskStatus(activeProject.id, taskId, status);
    },
    [activeProject, updateTaskStatus],
  );

  return (
    <div className="min-h-screen bg-background">
      {/* デモバナー */}
      <DemoBanner />

      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 md:gap-6 md:px-6">
        {/* タブ切替 */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center rounded-lg border bg-card p-0.5">
            <TabButton active={tab === "dashboard"} onClick={() => setTab("dashboard")}>
              <LayoutDashboard size={14} /> ダッシュボード
            </TabButton>
            <TabButton active={tab === "project"} onClick={() => setTab("project")}>
              <FolderOpen size={14} /> プロジェクト
            </TabButton>
          </div>
          <Link
            to="/signup"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Sparkles size={12} /> 無料アカウントを作る <ArrowRight size={12} />
          </Link>
        </div>

        {tab === "dashboard" ? (
          <DemoDashboard
            agg={aggregate}
            onOpenProject={(id) => {
              setActiveProjectId(id);
              setTab("project");
            }}
          />
        ) : (
          <DemoProjectView
            projects={projects}
            activeProject={activeProject}
            activeProjectId={activeProjectId}
            onSelectProject={(id) => setActiveProjectId(id)}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onToggle={toggleTaskInActive}
            onStatusChange={handleStatusChange}
          />
        )}
      </div>
    </div>
  );
}

/* ───────────── pieces ───────────── */

function DemoBanner() {
  return (
    <div className="border-b bg-primary/5">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-2.5 md:px-6">
        <Link to="/" className="flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-primary">
          <ArrowLeft size={14} /> トップに戻る
        </Link>
        <span className="hidden text-muted-foreground sm:inline">·</span>
        <span className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
          <Zap size={11} /> デモモード
        </span>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Info size={11} /> サンプルデータ・操作はメモリ内のみ・リロードで初期値に戻ります
        </span>
      </div>
    </div>
  );
}

function TabButton({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

interface AggShape {
  totalTasks:   number;
  totalActive:  number;
  totalDone:    number;
  totalOverdue: number;
  progressPct:  number;
  projStats:    { id: string; name: string; total: number; done: number; pct: number; overdue: number }[];
  overdueProjects: { id: string; name: string; total: number; done: number; pct: number; overdue: number }[];
}

function DemoDashboard({
  agg, onOpenProject,
}: {
  agg: AggShape;
  onOpenProject: (id: string) => void;
}) {
  const todayLabel = new Date().toLocaleDateString("ja-JP", {
    year: "numeric", month: "long", day: "numeric", weekday: "short",
  });

  return (
    <div className="flex flex-col gap-4 pb-8 md:gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{todayLabel}</p>
          <h1 className="text-2xl font-bold tracking-tight">こんにちは、ゲストさん</h1>
        </div>
        {agg.totalOverdue > 0 && (
          <div className="flex w-fit items-center gap-1.5 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-1.5 text-xs font-medium text-destructive">
            <AlertTriangle size={13} />
            期限切れタスクが {agg.totalOverdue} 件あります
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid shrink-0 grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <StatCard
          label="アクティブタスク"
          value={agg.totalActive}
          icon={<Circle size={16} className="text-muted-foreground" />}
        />
        <StatCard
          label="完了タスク"
          value={agg.totalDone}
          icon={<CheckCircle2 size={16} className="text-primary" />}
        />
        <StatCard
          label="期限切れ"
          value={agg.totalOverdue}
          icon={<AlertTriangle size={16} className={agg.totalOverdue > 0 ? "text-destructive" : "text-muted-foreground"} />}
          variant={agg.totalOverdue > 0 ? "danger" : "default"}
        />
        <StatCard
          label="全体進捗"
          value={agg.progressPct + "%"}
          progress={agg.progressPct}
          icon={<Zap size={16} className="text-amber-500" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left col */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* 期限切れプロジェクト */}
          <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-destructive" />
              <h2 className="text-sm font-semibold">期限切れタスクのあるプロジェクト</h2>
              {agg.overdueProjects.length > 0 && (
                <span className="ml-auto rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
                  {agg.overdueProjects.length}
                </span>
              )}
            </div>
            {agg.overdueProjects.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">期限切れタスクはありません</p>
            ) : (
              <div className="flex flex-col gap-2">
                {agg.overdueProjects.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onOpenProject(p.id)}
                    className="flex flex-col gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-left hover:bg-destructive/10 transition-colors sm:flex-row sm:items-center sm:gap-3"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <AlertTriangle size={14} className="shrink-0 text-destructive" />
                      <span className="min-w-0 truncate text-sm font-medium">{p.name}</span>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-destructive">期限切れ {p.overdue} 件</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* デモ案内カード */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-primary" />
              <h2 className="text-sm font-semibold text-foreground">このデモでできること</h2>
            </div>
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-primary" />
                <span>「プロジェクト」タブで <strong className="text-foreground">ツリー / カンバン / リスト</strong>の3ビューを切替</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-primary" />
                <span>カンバンでタスクを<strong className="text-foreground">ドラッグ&ドロップ</strong>してステータス変更</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-primary" />
                <span>ツリービューでマウスホイール / ピンチで<strong className="text-foreground">ズーム</strong></span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right col */}
        <div className="flex flex-col gap-6">
          <AnnouncementsCard />

          <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2">
              <FolderOpen size={15} className="text-muted-foreground" />
              <h2 className="text-sm font-semibold">プロジェクト進捗</h2>
            </div>
            <div className="flex flex-col gap-2">
              {agg.projStats.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onOpenProject(p.id)}
                  className="flex flex-col gap-2 rounded-lg border bg-card px-3 py-2.5 text-left hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{p.name}</span>
                    <StatusBadge status={p.pct === 100 ? "done" : "in_progress"} />
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
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DemoProjectView({
  projects, activeProject, activeProjectId, onSelectProject,
  viewMode, onViewModeChange, onToggle, onStatusChange,
}: {
  projects:        Project[];
  activeProject:   Project | null;
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  viewMode:        ViewMode;
  onViewModeChange:(mode: ViewMode) => void;
  onToggle:        (taskId: string) => void;
  onStatusChange:  (taskId: string, status: TaskStatus) => void;
}) {
  return (
    <div className="flex flex-col gap-4 pb-8 md:gap-6">
      {/* Project picker */}
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2">
          <GitBranch size={15} className="text-primary" />
          <span className="text-sm font-semibold">プロジェクトを選択</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {projects.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelectProject(p.id)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                activeProjectId === p.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-primary/40",
              )}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Task panel */}
      {activeProject ? (
        <div className="rounded-xl border bg-card p-4">
          <TaskPanel
            key={activeProject.id}
            tasks={activeProject.tasks}
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
            onToggle={onToggle}
            onStatusChange={onStatusChange}
            projectName={activeProject.name}
          />
        </div>
      ) : (
        <p className="py-12 text-center text-sm text-muted-foreground">プロジェクトを選択してください</p>
      )}
    </div>
  );
}
