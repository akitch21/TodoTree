import { Link } from "react-router-dom";
import {
  GitBranch, Columns3, List, Network, Search, Users,
  CheckCircle2, ArrowRight, Calendar, LayoutDashboard,
  UserCheck, Sparkles, ShieldCheck, Zap,
} from "lucide-react";
import LandingLayout from "@/components/layout/LandingLayout";
import Hero from "@/components/landing/hero";
import AppPreview from "@/components/landing/app-preview";

// ─── Feature cards data (実装に合わせて拡充) ─────────────────────────────────

type Feature = {
  icon: React.ReactNode;
  title: string;
  desc: string;
  /** Tailwind classes for icon background tile and ring */
  accent: string;
};

const FEATURES: Feature[] = [
  {
    icon:   <GitBranch size={20} />,
    title:  "ツリービュー",
    desc:   "親子関係でタスクを構造化。大きなタスクをサブタスクに分解して、依存関係まで把握できます。",
    accent: "bg-primary/10 text-primary ring-primary/20",
  },
  {
    icon:   <Columns3 size={20} />,
    title:  "カンバンボード",
    desc:   "待機中・進行中・完了の3列で進捗を一覧。ステータス移動はワンクリックで完結。",
    accent: "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20",
  },
  {
    icon:   <List size={20} />,
    title:  "リストビュー",
    desc:   "期限・担当・ステータスを表形式でフラットに把握。フィルタや並び替えに最適。",
    accent: "bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20",
  },
  {
    icon:   <Search size={20} />,
    title:  "⌘K グローバル検索",
    desc:   "コマンドパレットから全プロジェクト・タスクをリアルタイム検索。キーボードだけで移動できます。",
    accent: "bg-primary/10 text-primary ring-primary/20",
  },
  {
    icon:   <LayoutDashboard size={20} />,
    title:  "ダッシュボード統計",
    desc:   "アクティブ／完了／期限切れ／全体進捗を一目で。期限切れタスクは色付きで強調表示。",
    accent: "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20",
  },
  {
    icon:   <Users size={20} />,
    title:  "チームメンバー管理",
    desc:   "プロジェクトにメールで招待。Owner / Admin / Member の3段階ロールで権限を分離できます。",
    accent: "bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20",
  },
  {
    icon:   <Calendar size={20} />,
    title:  "期限・担当者管理",
    desc:   "タスクごとに期限と担当者を設定。期限切れ件数はダッシュボードで自動集計されます。",
    accent: "bg-primary/10 text-primary ring-primary/20",
  },
  {
    icon:   <UserCheck size={20} />,
    title:  "個人タスクも別枠で",
    desc:   "プロジェクトと分けて、自分専用のToDoも管理。チームと個人を1つのアプリで完結します。",
    accent: "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20",
  },
];

// ─── How-it-works steps ──────────────────────────────────────────────────────

const STEPS = [
  {
    n: "01",
    title: "プロジェクトを作成",
    desc:  "プロジェクト名と説明を入力するだけ。チームメンバーをメールアドレスで招待できます。",
  },
  {
    n: "02",
    title: "タスクをツリーで整理",
    desc:  "大きなタスクをサブタスクに分解。依存関係が視覚的に把握できます。",
  },
  {
    n: "03",
    title: "3つのビューで進捗管理",
    desc:  "ツリー・カンバン・リストを切り替えながら、チーム全体の状況を把握します。",
  },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <LandingLayout>
      {/* Hero */}
      <Hero />

      {/* App Preview — animated 3-view demo */}
      <AppPreview />

      {/* Features */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles size={11} /> 機能
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground">
              必要な機能が、<span className="lp-gradient-text">すべて揃っている</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              シンプルに使えて、チームが大きくなっても対応できる機能を揃えています。
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="lp-card-hover lp-fade-up rounded-2xl border bg-card p-6 shadow-sm"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div
                  className={
                    "mb-4 inline-flex items-center justify-center rounded-xl p-2.5 ring-1 " + f.accent
                  }
                >
                  {f.icon}
                </div>
                <h3 className="font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard highlight — シングルストーリー */}
      <section className="py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 lg:grid-cols-2">
          <div className="lp-fade-up">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/5 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
              <LayoutDashboard size={11} /> ダッシュボード
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground">
              朝、これを開けば<br />
              <span className="lp-gradient-text">今日やること</span>がわかる。
            </h2>
            <p className="mt-5 text-muted-foreground leading-7">
              全プロジェクトの進捗・期限切れタスク・担当タスクをひとつの画面に集約。
              重要なものは色付きで強調されるので、見落としません。
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              <Bullet icon={<CheckCircle2 size={14} className="text-primary" />}>
                アクティブ／完了／期限切れ／全体進捗 4つの指標
              </Bullet>
              <Bullet icon={<Calendar size={14} className="text-destructive" />}>
                期限切れタスクのあるプロジェクトを赤系で強調
              </Bullet>
              <Bullet icon={<UserCheck size={14} className="text-blue-500" />}>
                自分が担当しているタスクをまとめて確認
              </Bullet>
              <Bullet icon={<Zap size={14} className="text-amber-500" />}>
                プロジェクトごとの進捗率をプログレスバーで表示
              </Bullet>
            </ul>
          </div>

          {/* Mock dashboard */}
          <div className="lp-fade-up lp-delay-200 rounded-2xl border bg-card p-5 shadow-2xl shadow-primary/10 ring-1 ring-primary/10">
            <div className="grid grid-cols-2 gap-3">
              <DashStat label="アクティブ"  value="14" tone="muted"     />
              <DashStat label="完了"        value="32" tone="primary"   />
              <DashStat label="期限切れ"    value="2"  tone="destructive" />
              <DashStat label="全体進捗"    value="69%" tone="amber"    />
            </div>
            <div className="mt-4 rounded-xl border bg-muted/30 p-3 text-sm">
              <p className="mb-2 text-xs font-semibold text-foreground">プロジェクト進捗</p>
              {[
                { name: "プロジェクトA", pct: 78, status: "進行中" },
                { name: "リブランディング", pct: 42, status: "進行中" },
                { name: "API v2 移行", pct: 96, status: "進行中" },
              ].map((p, i) => (
                <div
                  key={p.name}
                  className="lp-fade-up flex items-center gap-3 py-1.5"
                  style={{ animationDelay: `${300 + i * 100}ms` }}
                >
                  <span className="flex-1 truncate text-xs">{p.name}</span>
                  <div className="lp-progress-bar relative h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                    <span style={{ "--lp-progress": `${p.pct}%` } as React.CSSProperties} />
                  </div>
                  <span className="w-10 text-right text-[10px] text-muted-foreground">{p.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="structure" className="py-24 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Zap size={11} /> 始め方
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground">
              <span className="lp-gradient-text">3ステップ</span>で始められる
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              複雑な設定は不要。登録してすぐにチームで使い始められます。
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div
                key={s.n}
                className="relative flex flex-col gap-4 lp-fade-up"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                {/* Connector arrow */}
                {i < STEPS.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute top-5 left-[calc(100%-24px)] hidden h-px w-8 bg-gradient-to-r from-primary/60 to-transparent md:block"
                  />
                )}
                <div className="flex items-center gap-3">
                  <span className="lp-pulse-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {s.n}
                  </span>
                  <h3 className="font-semibold text-foreground">{s.title}</h3>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team section */}
      <section id="team" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="rounded-3xl border bg-card overflow-hidden shadow-2xl shadow-primary/10 ring-1 ring-primary/10">
            <div className="grid md:grid-cols-2">
              {/* Left */}
              <div className="p-10 flex flex-col justify-center gap-6">
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/5 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                  <Users size={11} /> チーム活用
                </span>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                  チームで使うと、<br />
                  <span className="lp-gradient-text">もっと強くなる</span>
                </h2>
                <p className="text-muted-foreground leading-7">
                  プロジェクトにメンバーを招待し、タスクを担当者に割り当て。
                  Owner / Admin / Member の3段階ロールで、権限を細かくコントロールできます。
                </p>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {[
                    "メールアドレスでメンバー招待",
                    "Owner / Admin / Member のロール管理",
                    "タスクごとの担当者アサイン",
                    "招待の承認フロー",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div>
                  <Link
                    to="/signup"
                    className="lp-cta-glow inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                  >
                    チームで試してみる <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Right — animated member cards */}
              <div className="relative bg-muted/40 p-8 flex items-center justify-center overflow-hidden">
                <div
                  aria-hidden
                  className="lp-bg-shift pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-30 blur-3xl"
                  style={{ background: "radial-gradient(closest-side, var(--primary), transparent 70%)" }}
                />
                <div className="relative w-full max-w-xs space-y-3">
                  {[
                    { name: "田中 太郎", role: "Owner",  done: 3, total: 5, tone: "primary" as const  },
                    { name: "佐藤 花子", role: "Admin",  done: 5, total: 6, tone: "blue"    as const  },
                    { name: "鈴木 一郎", role: "Member", done: 1, total: 4, tone: "amber"   as const  },
                  ].map((m, i) => {
                    const pct = Math.round((m.done / m.total) * 100);
                    const ring =
                      m.tone === "primary" ? "ring-primary/30 bg-card"  :
                      m.tone === "blue"    ? "ring-blue-500/30 bg-card" :
                                             "ring-amber-500/30 bg-card";
                    return (
                      <div
                        key={m.name}
                        className={
                          "lp-fade-up rounded-xl border p-4 shadow-sm ring-1 transition-transform hover:-translate-y-0.5 " +
                          ring
                        }
                        style={{ animationDelay: `${i * 120}ms` }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={
                                "flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white " +
                                (m.tone === "primary"
                                  ? "bg-primary"
                                  : m.tone === "blue"
                                  ? "bg-blue-500"
                                  : "bg-amber-500")
                              }
                            >
                              {m.name.charAt(0)}
                            </span>
                            <div>
                              <p className="text-sm font-medium text-foreground">{m.name}</p>
                              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{m.role}</p>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">{m.done}/{m.total}</span>
                        </div>
                        <div className="lp-progress-bar h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <span style={{ "--lp-progress": `${pct}%` } as React.CSSProperties} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust line */}
      <section className="py-12">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><ShieldCheck size={15} className="text-primary" /> JWT 認証</span>
            <span className="flex items-center gap-2"><GitBranch   size={15} className="text-primary" /> ツリー型タスク</span>
            <span className="flex items-center gap-2"><Network     size={15} className="text-primary" /> 3ビュー切替</span>
            <span className="flex items-center gap-2"><Search      size={15} className="text-primary" /> ⌘K 検索</span>
            <span className="flex items-center gap-2"><Users       size={15} className="text-primary" /> 3段階ロール</span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="relative py-28">
        <div
          aria-hidden
          className="lp-bg-shift pointer-events-none absolute inset-x-0 top-1/2 -z-10 mx-auto h-72 max-w-3xl -translate-y-1/2 rounded-full blur-3xl opacity-25"
          style={{
            background:
              "radial-gradient(closest-side, var(--primary), transparent 50%), radial-gradient(closest-side at 80% 40%, #f59e0b, transparent 60%)",
          }}
        />
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-4xl font-bold tracking-tight text-foreground">
            今すぐ、<span className="lp-gradient-text">タスクをツリーで</span>整理しよう
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            無料でアカウントを作成し、チームのタスクをツリーで構造化。
            開発プレビュー期間中はすべての機能が無料で使えます。
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/signup"
              className="lp-cta-glow inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              無料アカウントを作成 <ArrowRight size={15} />
            </Link>
            <Link
              to="/demo"
              className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-card px-8 py-3.5 text-sm font-semibold text-primary transition hover:bg-primary/5"
            >
              ログイン不要でデモを試す
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg border bg-card px-8 py-3.5 text-sm font-semibold text-foreground transition hover:bg-accent hover:border-primary/40"
            >
              ログイン
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">クレジットカード不要。登録は30秒。</p>
        </div>
      </section>
    </LandingLayout>
  );
}

/* ───────────── helpers ───────────── */

function Bullet({
  icon, children,
}: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-muted-foreground">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span>{children}</span>
    </li>
  );
}

function DashStat({
  label, value, tone,
}: {
  label: string;
  value: string;
  tone: "muted" | "primary" | "destructive" | "amber";
}) {
  const styles =
    tone === "primary"     ? "border-primary/30 bg-primary/5 text-primary"               :
    tone === "destructive" ? "border-destructive/30 bg-destructive/5 text-destructive"   :
    tone === "amber"       ? "border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400" :
                             "border-border bg-muted/30 text-foreground";
  return (
    <div className={"rounded-xl border p-3 " + styles}>
      <p className="text-[10px] uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}
