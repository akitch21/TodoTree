import { useEffect, useState } from "react";
import {
  Network, Columns3, List, GitBranch, Search,
  AlertTriangle, CheckCircle2, Circle, Zap, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "tree" | "kanban" | "list";

const VIEWS: { mode: ViewMode; label: string; icon: React.ReactNode }[] = [
  { mode: "tree",   label: "ツリー",   icon: <Network  size={13} /> },
  { mode: "kanban", label: "カンバン", icon: <Columns3 size={13} /> },
  { mode: "list",   label: "リスト",   icon: <List     size={13} /> },
];

/**
 * AppPreview — "live demo" section that auto-cycles between the three views
 * supported by the actual app. Acts like an animated screen recording.
 */
export default function AppPreview() {
  const [view, setView] = useState<ViewMode>("tree");

  // Auto-cycle every 4 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setView((v) => (v === "tree" ? "kanban" : v === "kanban" ? "list" : "tree"));
    }, 4200);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="preview" className="relative py-24">
      {/* subtle backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.03] dark:opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 25% 15%, var(--primary), transparent 50%), radial-gradient(circle at 75% 85%, #3b82f6, transparent 50%)",
        }}
      />

      <div className="mx-auto max-w-6xl px-6">
        {/* heading */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Zap size={11} /> ライブプレビュー
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground">
            <span className="lp-gradient-text">3つのビュー</span>で、好きな見方に切り替え
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            同じタスクを、ツリー・カンバン・リストの3種類で表示。プロジェクトの規模やフェーズに合わせて切り替えできます。
          </p>
        </div>

        {/* App window */}
        <div className="mt-12 rounded-2xl border bg-card shadow-2xl shadow-primary/10 ring-1 ring-primary/10 overflow-hidden">
          {/* Title bar */}
          <div className="flex items-center gap-1.5 border-b bg-muted/50 px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
            <span className="ml-3 text-[11px] text-muted-foreground">
              ToDoTree — プロジェクトA
            </span>
            <span className="ml-auto hidden items-center gap-1 rounded-md border bg-background px-2 py-0.5 text-[10px] text-muted-foreground sm:flex">
              <Search size={10} /> 検索…
              <kbd className="ml-1 rounded bg-muted px-1 text-[9px]">⌘K</kbd>
            </span>
          </div>

          {/* Stat strip — mirrors DashboardPage stats */}
          <div className="grid grid-cols-2 gap-3 border-b bg-muted/30 p-4 sm:grid-cols-4">
            <Stat label="アクティブ"  value="14" icon={<Circle size={14} className="text-muted-foreground" />} />
            <Stat label="完了"        value="32" icon={<CheckCircle2 size={14} className="text-primary" />} accent="primary" />
            <Stat label="期限切れ"    value="2"  icon={<AlertTriangle size={14} className="text-destructive" />} accent="destructive" />
            <Stat label="進捗"        value="69%" icon={<Zap size={14} className="text-amber-500" />} accent="amber" />
          </div>

          {/* View tabs */}
          <div className="flex items-center justify-between border-b px-4 py-2.5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <GitBranch size={14} className="text-primary" />
              プロジェクトA
            </div>
            <div className="flex items-center rounded-lg border p-0.5">
              {VIEWS.map(({ mode, label, icon }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setView(mode)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors md:px-3",
                    view === mode
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {icon}
                  <span className="hidden md:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* View body — animates on switch */}
          <div key={view} className="lp-fade-in min-h-[340px] p-5 sm:p-6">
            {view === "tree"   && <TreeMock />}
            {view === "kanban" && <KanbanMock />}
            {view === "list"   && <ListMock />}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          ↑ 自動でビューが切り替わります。タブをクリックしても操作できます。
        </p>
      </div>
    </section>
  );
}

/* ───────────── pieces ───────────── */

function Stat({
  label, value, icon, accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: "primary" | "destructive" | "amber";
}) {
  const ring =
    accent === "primary"     ? "border-primary/30 bg-primary/5" :
    accent === "destructive" ? "border-destructive/30 bg-destructive/5" :
    accent === "amber"       ? "border-amber-300/40 bg-amber-50 dark:bg-amber-950/20" :
                               "border-border bg-background";
  return (
    <div className={cn("flex items-center gap-3 rounded-lg border px-3 py-2.5", ring)}>
      {icon}
      <div className="leading-tight">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-base font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

const TASKS = [
  { id: "t1", label: "UI設計",            status: "done"        as const, sub: ["ワイヤーフレーム作成", "デザインレビュー"] },
  { id: "t2", label: "バックエンド開発",  status: "in_progress" as const, sub: ["API設計", "DB設計"] },
  { id: "t3", label: "テスト",            status: "pending"     as const, sub: [] },
];

function TreeMock() {
  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center gap-2 font-semibold text-foreground">
        <GitBranch size={14} className="text-primary" />
        プロジェクトA
        <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Users size={11} /> 3名
        </span>
      </div>
      <div className="ml-4 border-l border-primary/30 pl-4 space-y-2">
        {TASKS.map((t, i) => (
          <div key={t.id} className="space-y-2 lp-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
            <TaskRow label={t.label} status={t.status} />
            {t.sub.length > 0 && (
              <div className="ml-4 border-l border-primary/20 pl-4 space-y-2">
                {t.sub.map((s, j) => (
                  <TaskRow
                    key={s}
                    label={s}
                    status={
                      i === 0 ? "done" :
                      i === 1 && j === 0 ? "done" :
                      i === 1 && j === 1 ? "in_progress" : "pending"
                    }
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const KANBAN_COLUMNS: { id: "pending" | "in_progress" | "done"; title: string; count: number; tone: string; }[] = [
  { id: "pending",     title: "待機中", count: 3, tone: "border-muted-foreground/30 bg-muted/30" },
  { id: "in_progress", title: "進行中", count: 4, tone: "border-amber-300/40 bg-amber-50/60 dark:bg-amber-950/20" },
  { id: "done",        title: "完了",   count: 5, tone: "border-primary/30 bg-primary/5" },
];

const KANBAN_CARDS = {
  pending:     ["テスト", "リリースノート", "本番デプロイ"],
  in_progress: ["DB設計", "バックエンド開発", "認証実装", "Stripe調整"],
  done:        ["UI設計", "ワイヤーフレーム", "デザインレビュー", "API設計", "ロゴ作成"],
};

function KanbanMock() {
  return (
    <div className="grid grid-cols-3 gap-3 text-sm">
      {KANBAN_COLUMNS.map((col, ci) => (
        <div
          key={col.id}
          className={cn(
            "rounded-lg border p-2.5 lp-fade-up",
            col.tone
          )}
          style={{ animationDelay: `${ci * 100}ms` }}
        >
          <div className="mb-2 flex items-center justify-between text-xs font-medium">
            <span>{col.title}</span>
            <span className="rounded-full bg-background px-1.5 py-0.5 text-[10px]">{col.count}</span>
          </div>
          <div className="space-y-1.5">
            {KANBAN_CARDS[col.id].map((card, i) => (
              <div
                key={card}
                className={cn(
                  "rounded-md border bg-card px-2.5 py-2 text-[12px] text-foreground shadow-sm lp-fade-up",
                  col.id === "in_progress" && i === 0 && "ring-1 ring-amber-400/60",
                  col.id === "done" && "text-muted-foreground line-through"
                )}
                style={{ animationDelay: `${ci * 100 + i * 60 + 80}ms` }}
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

function ListMock() {
  const rows = [
    { label: "UI設計",             status: "done"        as const, due: "2026-04-30", assignee: "田中" },
    { label: "ワイヤーフレーム作成", status: "done"        as const, due: "2026-04-22", assignee: "佐藤" },
    { label: "デザインレビュー",     status: "done"        as const, due: "2026-04-28", assignee: "鈴木" },
    { label: "API設計",            status: "done"        as const, due: "2026-05-02", assignee: "田中" },
    { label: "DB設計",             status: "in_progress" as const, due: "2026-05-09", assignee: "佐藤" },
    { label: "バックエンド開発",     status: "in_progress" as const, due: "2026-05-12", assignee: "鈴木" },
    { label: "テスト",             status: "pending"     as const, due: "2026-05-20", assignee: "—" },
  ];

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left font-medium">タスク</th>
            <th className="px-3 py-2 text-left font-medium">ステータス</th>
            <th className="hidden px-3 py-2 text-left font-medium sm:table-cell">期限</th>
            <th className="hidden px-3 py-2 text-left font-medium sm:table-cell">担当</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.label}
              className="lp-fade-up border-t hover:bg-accent/30 transition-colors"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <td className={cn("px-3 py-2", r.status === "done" && "text-muted-foreground line-through")}>
                {r.label}
              </td>
              <td className="px-3 py-2">
                <StatusPill status={r.status} />
              </td>
              <td className="hidden px-3 py-2 text-xs text-muted-foreground sm:table-cell">{r.due}</td>
              <td className="hidden px-3 py-2 text-xs text-muted-foreground sm:table-cell">{r.assignee}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TaskRow({
  label, status,
}: { label: string; status: "pending" | "in_progress" | "done" }) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 transition-colors hover:border-primary/40">
      <span
        className={cn(
          "flex items-center gap-2",
          status === "done" ? "text-muted-foreground line-through" : "text-foreground"
        )}
      >
        {status === "done" ? (
          <CheckCircle2 size={13} className="text-primary" />
        ) : status === "in_progress" ? (
          <Circle size={13} className="text-amber-500" />
        ) : (
          <Circle size={13} className="text-muted-foreground" />
        )}
        {label}
      </span>
      <StatusPill status={status} />
    </div>
  );
}

function StatusPill({ status }: { status: "pending" | "in_progress" | "done" }) {
  const cls =
    status === "done"
      ? "bg-primary/10 text-primary"
      : status === "in_progress"
      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
      : "bg-muted text-muted-foreground";
  const txt =
    status === "done" ? "完了" : status === "in_progress" ? "進行中" : "待機中";
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", cls)}>
      {txt}
    </span>
  );
}
