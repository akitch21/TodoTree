import { Link } from "react-router-dom";
import { ArrowRight, CheckSquare, GitBranch, Users } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-24">
      {/* Subtle grid background */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.03] dark:opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 lg:grid-cols-2">
        {/* Left */}
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
            チーム向けタスク管理
          </span>

          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
            タスクの関係を、
            <br />
            <span className="text-primary">見える化</span>する。
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-8 text-muted-foreground">
            ToDoTree は、タスクをツリー構造で整理し、誰が何をすべきかを一目で理解できるプロジェクト管理ツールです。
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              無料で始める <ArrowRight size={15} />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-lg border px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-accent"
            >
              詳しく見る
            </a>
          </div>

          {/* Trust badges */}
          <div className="mt-8 flex flex-wrap items-center gap-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><CheckSquare size={13} className="text-primary" /> 登録30秒・無料</span>
            <span className="flex items-center gap-1.5"><GitBranch   size={13} className="text-primary" /> ツリー構造で整理</span>
            <span className="flex items-center gap-1.5"><Users       size={13} className="text-primary" /> チームで共有</span>
          </div>
        </div>

        {/* Right — mock app UI */}
        <div className="rounded-2xl border bg-card shadow-2xl shadow-black/10 overflow-hidden">
          {/* Titlebar */}
          <div className="flex items-center gap-1.5 border-b bg-muted/50 px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
            <span className="ml-3 text-[11px] text-muted-foreground">ToDoTree — プロジェクトA</span>
          </div>

          <div className="p-5 space-y-3 text-sm">
            {/* Project root */}
            <div className="font-semibold text-foreground flex items-center gap-2">
              <GitBranch size={14} className="text-primary" /> プロジェクトA
            </div>

            {/* Tree */}
            <div className="ml-4 border-l pl-4 space-y-2">
              <MockTask label="UI設計" status="in_progress" />
              <div className="ml-4 border-l pl-4 space-y-2">
                <MockTask label="ワイヤーフレーム作成" status="done" />
                <MockTask label="デザインレビュー" status="pending" />
              </div>
              <MockTask label="バックエンド開発" status="in_progress" />
              <div className="ml-4 border-l pl-4 space-y-2">
                <MockTask label="API設計" status="done" />
                <MockTask label="DB設計"  status="in_progress" />
              </div>
              <MockTask label="テスト" status="pending" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MockTask({ label, status }: { label: string; status: "pending" | "in_progress" | "done" }) {
  const badge =
    status === "done"        ? "bg-primary/10 text-primary"          :
    status === "in_progress" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                               "bg-muted text-muted-foreground";
  const text =
    status === "done" ? "完了" : status === "in_progress" ? "進行中" : "待機中";

  return (
    <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2">
      <span className={status === "done" ? "line-through text-muted-foreground" : "text-foreground"}>
        {label}
      </span>
      <span className={"rounded-full px-2 py-0.5 text-[10px] font-medium " + badge}>{text}</span>
    </div>
  );
}
