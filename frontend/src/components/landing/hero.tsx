import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight, CheckSquare, GitBranch, Users, Sparkles, Zap, Search,
  Folder, FolderOpen, Columns3, Network,
  AlertTriangle,
} from "lucide-react";
import ReactFlow, {
  Background, MarkerType, Position,
  type Node, type Edge, type NodeProps,
} from "reactflow";
import "reactflow/dist/style.css";
import { cn } from "@/lib/utils";

type HeroView = "projects" | "tree" | "kanban";
type Status = "pending" | "in_progress" | "done";

const HERO_VIEWS: { mode: HeroView; label: string; icon: React.ReactNode }[] = [
  { mode: "projects", label: "プロジェクト", icon: <FolderOpen size={11} /> },
  { mode: "tree",     label: "ツリー",       icon: <Network    size={11} /> },
  { mode: "kanban",   label: "カンバン",     icon: <Columns3   size={11} /> },
];

/** Fixed body height — keeps the card from changing height between views.  */
const HERO_BODY_H = 320;

/**
 * Hero — landing page top section.
 *
 * Right-side mock auto-cycles through three views:
 *  1. プロジェクト一覧（進捗バー付き）
 *  2. タスクツリー（ReactFlow 木構造、順次完了アニメ）
 *  3. カンバン（待機/進行/完了）
 *
 * The body is a fixed height (HERO_BODY_H) so switching views
 * does not cause the page to re-layout vertically.
 */
export default function Hero() {
  const [view, setView] = useState<HeroView>("projects");
  const [step, setStep] = useState(0);

  // Cycle the visible view every 4.2s
  useEffect(() => {
    const id = setInterval(() => {
      setView((v) =>
        v === "projects" ? "tree" : v === "tree" ? "kanban" : "projects"
      );
    }, 4200);
    return () => clearInterval(id);
  }, []);

  // Tree-completion ticker — only runs while the tree view is shown
  useEffect(() => {
    if (view !== "tree") return;
    setStep(0);
    const id = setInterval(() => setStep((s) => (s < 5 ? s + 1 : s)), 700);
    return () => clearInterval(id);
  }, [view]);

  const treeProgressPct = Math.min(100, 30 + step * 12);

  return (
    <section className="relative overflow-hidden pt-32 pb-24">
      {/* Animated forest-ish blob backdrop */}
      <div
        aria-hidden
        className="lp-bg-shift pointer-events-none absolute -top-32 -left-24 -z-10 h-[480px] w-[480px] rounded-full blur-3xl opacity-30 dark:opacity-20"
        style={{ background: "radial-gradient(closest-side, var(--primary), transparent 70%)" }}
      />
      <div
        aria-hidden
        className="lp-bg-shift pointer-events-none absolute -bottom-32 -right-24 -z-10 h-[460px] w-[460px] rounded-full blur-3xl opacity-25 dark:opacity-15"
        style={{
          background: "radial-gradient(closest-side, #f59e0b, transparent 70%)",
          animationDelay: "-7s",
        }}
      />

      {/* Drifting grid */}
      <div
        aria-hidden
        className="lp-grid-drift pointer-events-none absolute inset-0 -z-10 opacity-[0.04] dark:opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 lg:grid-cols-2">
        {/* ─── Left ─── */}
        <div>
          <span className="lp-fade-up inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles size={12} className="text-primary" />
            チーム向けタスク管理 — 開発プレビュー無料
          </span>

          <h1 className="lp-fade-up lp-delay-100 mt-5 text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
            タスクの関係を、
            <br />
            <span className="lp-gradient-text">見える化</span>する。
          </h1>

          <p className="lp-fade-up lp-delay-200 mt-6 max-w-lg text-lg leading-8 text-muted-foreground">
            ToDoTree は、タスクを<strong className="text-foreground">ツリー構造</strong>で整理し、
            <strong className="text-foreground">ツリー / カンバン / リスト</strong>の3ビューで
            チーム全体の状況を一目で理解できるプロジェクト管理ツールです。
          </p>

          <div className="lp-fade-up lp-delay-300 mt-8 flex flex-wrap gap-3">
            <Link
              to="/signup"
              className="lp-cta-glow inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              無料で始める <ArrowRight size={15} />
            </Link>
            <Link
              to="/demo"
              className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-card px-6 py-3 text-sm font-semibold text-primary transition hover:bg-primary/5"
            >
              <Zap size={14} className="text-amber-500" /> ログイン不要でデモを試す
            </Link>
          </div>

          {/* Trust badges */}
          <div className="lp-fade-up lp-delay-400 mt-8 flex flex-wrap items-center gap-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckSquare size={13} className="text-primary" /> 登録30秒・無料
            </span>
            <span className="flex items-center gap-1.5">
              <GitBranch size={13} className="text-primary" /> ツリー構造で整理
            </span>
            <span className="flex items-center gap-1.5">
              <Users size={13} className="text-primary" /> チームで共有
            </span>
          </div>
        </div>

        {/* ─── Right — auto-cycling app mock (fixed-height body) ─── */}
        <div className="lp-fade-up lp-delay-300 relative">
          {/* Floating ⌘K hint */}
          <div
            className="lp-float-soft absolute -top-4 -left-3 z-10 hidden items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-[11px] font-medium text-muted-foreground shadow-md sm:inline-flex"
            style={{ animationDelay: "-2s" }}
          >
            <Search size={11} className="text-primary" />
            <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-foreground">⌘K</kbd>
            グローバル検索
          </div>

          {/* Floating progress chip */}
          <div className="lp-float-soft absolute -bottom-4 -right-3 z-10 hidden items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-[11px] font-medium shadow-md sm:inline-flex">
            <span className="relative flex h-2 w-2">
              <span className="lp-pulse-ring absolute inline-flex h-full w-full rounded-full bg-primary" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="text-muted-foreground">進捗</span>
            <span className="text-foreground">
              {view === "tree" ? `${treeProgressPct}%` : "69%"}
            </span>
          </div>

          <div className="rounded-2xl border bg-card shadow-2xl shadow-primary/10 overflow-hidden ring-1 ring-primary/10">
            {/* Titlebar */}
            <div className="flex items-center gap-1.5 border-b bg-muted/50 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
              <span className="ml-3 truncate text-[11px] text-muted-foreground">
                ToDoTree —
                {view === "projects"
                  ? " ダッシュボード"
                  : view === "tree"
                  ? " プロジェクトA / タスク"
                  : " プロジェクトA / カンバン"}
              </span>
              <span className="ml-auto flex items-center gap-1 rounded-md border bg-background px-2 py-0.5 text-[10px] text-muted-foreground">
                <Search size={10} /> 検索…
                <kbd className="ml-1 rounded bg-muted px-1 text-[9px]">⌘K</kbd>
              </span>
            </div>

            {/* View tabs (mini) */}
            <div className="flex items-center gap-1 border-b bg-muted/30 px-3 py-1.5">
              {HERO_VIEWS.map(({ mode, label, icon }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setView(mode)}
                  className={cn(
                    "flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
                    view === mode
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {icon}
                  {label}
                </button>
              ))}
              <span className="ml-auto flex items-center gap-1 text-[9px] text-muted-foreground">
                <span className="lp-pulse-ring h-1.5 w-1.5 rounded-full bg-primary" />
                LIVE
              </span>
            </div>

            {/* View body — FIXED height to prevent vertical layout shift */}
            <div
              className="relative"
              style={{ height: HERO_BODY_H }}
            >
              <div key={view} className="lp-fade-in absolute inset-0">
                {view === "projects" && <ProjectsMock />}
                {view === "tree"     && <TreeFlowMock step={step} />}
                {view === "kanban"   && <KanbanMock />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────── ProjectsMock ───────────── */
function ProjectsMock() {
  const projects = [
    { name: "プロジェクトA",       status: "進行中", done: 14, total: 18, overdue: 0 },
    { name: "リブランディング",     status: "進行中", done:  6, total: 14, overdue: 2 },
    { name: "API v2 移行",        status: "進行中", done: 23, total: 24, overdue: 0 },
    { name: "マーケサイト",        status: "待機中", done:  0, total:  9, overdue: 0 },
  ];

  return (
    <div className="h-full overflow-hidden p-5 space-y-2 text-sm">
      <div className="mb-3 flex items-center gap-2 text-foreground">
        <FolderOpen size={14} className="text-primary" />
        <span className="font-semibold">プロジェクト一覧</span>
        <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
          {projects.length}件
        </span>
      </div>

      {projects.map((p, i) => {
        const pct = p.total > 0 ? Math.round((p.done / p.total) * 100) : 0;
        const ring =
          p.overdue > 0
            ? "border-amber-300/40 bg-amber-50/40 dark:bg-amber-950/10"
            : "hover:border-primary/40";
        return (
          <div
            key={p.name}
            className={cn(
              "lp-fade-up rounded-lg border bg-background px-3 py-2 transition-colors",
              ring
            )}
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <div className="flex items-center gap-2">
              <Folder size={13} className="shrink-0 text-muted-foreground" />
              <span className="truncate text-[13px] font-medium text-foreground">{p.name}</span>
              {p.overdue > 0 && (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[9px] font-medium text-destructive">
                  <AlertTriangle size={9} /> 期限切れ {p.overdue}
                </span>
              )}
              <span
                className={cn(
                  "ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium",
                  p.status === "進行中"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {p.status}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="lp-progress-bar relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <span style={{ "--lp-progress": `${pct}%` } as React.CSSProperties} />
              </div>
              <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
                {p.done}/{p.total} · {pct}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ───────────── TreeFlowMock ─────────────
 * Real ReactFlow tree visualization for the hero — same library used in
 * the actual app (TreeView.tsx). Interaction is locked down for hero use.
 */

const NODE_W = 124;
const NODE_H = 36;

interface MockTaskNodeData {
  label:    string;
  status:   Status;
  highlight?: boolean;
}

function MockTaskNode({ data }: NodeProps<MockTaskNodeData>) {
  const { label, status, highlight } = data;
  const cls =
    status === "done"
      ? "border-primary/40 bg-primary/5 text-primary"
      : status === "in_progress"
      ? "border-amber-400/60 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
      : "border-border bg-background text-foreground";
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-md border px-2 text-[11px] font-medium shadow-sm transition-all duration-500",
        cls,
        highlight && "ring-2 ring-primary/40 shadow-md"
      )}
      style={{ width: NODE_W, height: NODE_H }}
    >
      <span className={status === "done" ? "line-through opacity-80" : ""}>{label}</span>
    </div>
  );
}

function MockProjectNode({ data }: NodeProps<{ label: string }>) {
  return (
    <div
      className="flex items-center justify-center gap-1.5 rounded-md border-2 border-primary bg-primary text-primary-foreground px-2 text-[11px] font-semibold shadow-md"
      style={{ width: NODE_W, height: NODE_H }}
    >
      <GitBranch size={11} />
      {data.label}
    </div>
  );
}

const heroNodeTypes = {
  mockTask:    MockTaskNode,
  mockProject: MockProjectNode,
};

/** Compute (label, status) for tree based on the current `step` */
function statusFor(step: number, key: string): Status {
  switch (key) {
    case "ui":       return step >= 1 ? "done" : "in_progress";
    case "wf":       return "done";
    case "review":   return step >= 2 ? "done" : "pending";
    case "be":       return step >= 3 ? "done" : "in_progress";
    case "api":      return "done";
    case "db":       return step >= 4 ? "done" : "in_progress";
    case "test":     return step >= 5 ? "done" : "pending";
    default:         return "pending";
  }
}

function highlightFor(step: number, key: string): boolean {
  if (step === 0 && key === "ui") return true;
  if (step === 1 && key === "review") return true;
  if (step === 2 && key === "be") return true;
  if (step === 3 && key === "db") return true;
  if (step === 4 && key === "test") return true;
  return false;
}

function TreeFlowMock({ step }: { step: number }) {
  // Layout: root at top, three children, two of which have leaves
  // Positions hand-tuned to fit a ~440x300 ReactFlow viewport with fitView
  const nodes: Node[] = useMemo(() => {
    const sourcePosition = Position.Bottom;
    const targetPosition = Position.Top;
    return [
      // Depth 0: project root
      {
        id: "root",
        type: "mockProject",
        position: { x: 220, y: 0 },
        data: { label: "プロジェクトA" },
        sourcePosition,
        targetPosition,
        draggable: false,
        selectable: false,
      },
      // Depth 1: three branches
      {
        id: "ui",
        type: "mockTask",
        position: { x: 30, y: 80 },
        data: { label: "UI設計", status: statusFor(step, "ui"), highlight: highlightFor(step, "ui") },
        sourcePosition,
        targetPosition,
        draggable: false,
        selectable: false,
      },
      {
        id: "be",
        type: "mockTask",
        position: { x: 220, y: 80 },
        data: { label: "バックエンド", status: statusFor(step, "be"), highlight: highlightFor(step, "be") },
        sourcePosition,
        targetPosition,
        draggable: false,
        selectable: false,
      },
      {
        id: "test",
        type: "mockTask",
        position: { x: 410, y: 80 },
        data: { label: "テスト", status: statusFor(step, "test"), highlight: highlightFor(step, "test") },
        sourcePosition,
        targetPosition,
        draggable: false,
        selectable: false,
      },
      // Depth 2: leaves under UI設計
      {
        id: "wf",
        type: "mockTask",
        position: { x: -50, y: 170 },
        data: { label: "ワイヤー", status: statusFor(step, "wf") },
        sourcePosition,
        targetPosition,
        draggable: false,
        selectable: false,
      },
      {
        id: "review",
        type: "mockTask",
        position: { x: 80, y: 170 },
        data: { label: "レビュー", status: statusFor(step, "review"), highlight: highlightFor(step, "review") },
        sourcePosition,
        targetPosition,
        draggable: false,
        selectable: false,
      },
      // Depth 2: leaves under バックエンド
      {
        id: "api",
        type: "mockTask",
        position: { x: 165, y: 170 },
        data: { label: "API設計", status: statusFor(step, "api") },
        sourcePosition,
        targetPosition,
        draggable: false,
        selectable: false,
      },
      {
        id: "db",
        type: "mockTask",
        position: { x: 295, y: 170 },
        data: { label: "DB設計", status: statusFor(step, "db"), highlight: highlightFor(step, "db") },
        sourcePosition,
        targetPosition,
        draggable: false,
        selectable: false,
      },
    ];
  }, [step]);

  const edges: Edge[] = useMemo(() => {
    const baseStyle = { stroke: "var(--border)", strokeWidth: 1.5 };
    const doneStyle = { stroke: "var(--primary)", strokeWidth: 1.5 };
    const arrow = { type: MarkerType.ArrowClosed, color: "var(--border)", width: 12, height: 12 };
    return [
      { id: "e-r-ui",    source: "root", target: "ui",     type: "smoothstep", style: doneStyle, markerEnd: { ...arrow, color: "var(--primary)" } },
      { id: "e-r-be",    source: "root", target: "be",     type: "smoothstep", style: doneStyle, markerEnd: { ...arrow, color: "var(--primary)" } },
      { id: "e-r-test",  source: "root", target: "test",   type: "smoothstep", style: doneStyle, markerEnd: { ...arrow, color: "var(--primary)" } },
      { id: "e-ui-wf",   source: "ui",   target: "wf",     type: "smoothstep", style: baseStyle, markerEnd: arrow },
      { id: "e-ui-rv",   source: "ui",   target: "review", type: "smoothstep", style: baseStyle, markerEnd: arrow },
      { id: "e-be-api",  source: "be",   target: "api",    type: "smoothstep", style: baseStyle, markerEnd: arrow },
      { id: "e-be-db",   source: "be",   target: "db",     type: "smoothstep", style: baseStyle, markerEnd: arrow },
    ];
  }, []);

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={heroNodeTypes}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        minZoom={0.3}
        maxZoom={1.6}
        proOptions={{ hideAttribution: true }}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        preventScrolling={false}
      >
        <Background gap={18} size={1} color="var(--border)" />
      </ReactFlow>

      {/* progress strip overlaid at the bottom of the tree pane */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 border-t bg-card/80 px-4 py-2 text-xs text-muted-foreground backdrop-blur">
        <span>全体進捗</span>
        <div className="lp-progress-bar relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <span
            className="absolute inset-y-0 left-0 bg-primary"
            style={{
              width: `${30 + step * 12}%`,
              transition: "width 700ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        </div>
        <span className="text-foreground font-medium tabular-nums">
          {Math.min(100, 30 + step * 12)}%
        </span>
      </div>
    </div>
  );
}

/* ───────────── KanbanMock ───────────── */
function KanbanMock() {
  const cols: { id: "pending" | "in_progress" | "done"; title: string; tone: string; cards: string[] }[] = [
    {
      id: "pending",
      title: "待機",
      tone: "border-muted-foreground/30 bg-muted/30",
      cards: ["テスト", "デプロイ", "リリースノート"],
    },
    {
      id: "in_progress",
      title: "進行中",
      tone: "border-amber-300/40 bg-amber-50/60 dark:bg-amber-950/20",
      cards: ["DB設計", "認証", "Stripe"],
    },
    {
      id: "done",
      title: "完了",
      tone: "border-primary/30 bg-primary/5",
      cards: ["UI設計", "API設計", "ロゴ", "ワイヤー"],
    },
  ];

  return (
    <div className="grid h-full grid-cols-3 gap-2 overflow-hidden p-5 text-xs">
      {cols.map((col, ci) => (
        <div
          key={col.id}
          className={cn("rounded-lg border p-2 lp-fade-up", col.tone)}
          style={{ animationDelay: `${ci * 80}ms` }}
        >
          <div className="mb-1.5 flex items-center justify-between text-[10px] font-medium">
            <span>{col.title}</span>
            <span className="rounded-full bg-background px-1.5 py-0.5 text-[9px]">
              {col.cards.length}
            </span>
          </div>
          <div className="space-y-1">
            {col.cards.map((card, i) => (
              <div
                key={card}
                className={cn(
                  "lp-fade-up rounded-md border bg-card px-2 py-1.5 text-[11px] text-foreground shadow-sm",
                  col.id === "in_progress" && i === 0 && "ring-1 ring-amber-400/60",
                  col.id === "done" && "text-muted-foreground line-through"
                )}
                style={{ animationDelay: `${ci * 80 + i * 60 + 80}ms` }}
              >
                {card}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
