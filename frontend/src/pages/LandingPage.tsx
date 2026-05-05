import { Link } from "react-router-dom";
import {
  GitBranch, Columns3, Search, Users,
  CheckCircle2, ArrowRight,
} from "lucide-react";
import LandingLayout from "@/components/layout/LandingLayout";
import Hero from "@/components/landing/hero";

// ─── Feature cards data ──────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: <GitBranch size={20} className="text-primary" />,
    title: "ツリービュー",
    desc: "タスクを親子関係で構造化。大きなプロジェクトも分解して管理しやすくなります。",
  },
  {
    icon: <Columns3 size={20} className="text-primary" />,
    title: "カンバンボード",
    desc: "待機中・進行中・完了の3列で進捗を一覧。ステータス移動はボタン一発。",
  },
  {
    icon: <Search size={20} className="text-primary" />,
    title: "グローバル検索",
    desc: "⌘K でコマンドパレットを開いて、全プロジェクト・タスクをリアルタイム検索。",
  },
  {
    icon: <Users size={20} className="text-primary" />,
    title: "チームメンバー管理",
    desc: "プロジェクトにメンバーを招待し、Owner / Member のロールで権限を管理できます。",
  },
];

// ─── How-it-works steps ───────────────────────────────────────────────────────

const STEPS = [
  {
    n: "01",
    title: "プロジェクトを作成",
    desc: "プロジェクト名と説明を入力するだけ。チームメンバーをすぐに招待できます。",
  },
  {
    n: "02",
    title: "タスクをツリーで整理",
    desc: "大きなタスクをサブタスクに分解。依存関係が視覚的に把握できます。",
  },
  {
    n: "03",
    title: "進捗を3つのビューで管理",
    desc: "ツリー・リスト・カンバンを切り替えながら、チーム全体の状況を把握します。",
  },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <LandingLayout>
      {/* Hero */}
      <Hero />

      {/* Features */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              必要な機能が、すべて揃っている
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              シンプルに使えて、チームが大きくなっても対応できる機能を揃えています。
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-primary/10 p-2.5">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="structure" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              3ステップで始められる
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              複雑な設定は不要。登録してすぐにチームで使い始められます。
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative flex flex-col gap-4">
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <span className="absolute top-5 left-[calc(100%-24px)] hidden h-px w-8 bg-border md:block" />
                )}
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
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
      <section id="team" className="py-24 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6">
          <div className="rounded-3xl border bg-card overflow-hidden shadow-sm">
            <div className="grid md:grid-cols-2">
              {/* Left */}
              <div className="p-10 flex flex-col justify-center gap-6">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                  チームで使うと、<br />もっと強くなる
                </h2>
                <p className="text-muted-foreground leading-7">
                  プロジェクトにメンバーを追加し、タスクを担当者に割り当て。誰が何に取り組んでいるかが一目でわかります。
                </p>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {[
                    "メンバーへのタスクアサイン",
                    "プロジェクトごとのロール管理",
                    "ダッシュボードで期限タスクを確認",
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
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                  >
                    チームで試してみる <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Right — mock member cards */}
              <div className="bg-muted/50 p-8 flex items-center justify-center">
                <div className="w-full max-w-xs space-y-3">
                  {[
                    { name: "田中 太郎",  role: "Owner",  done: 3, total: 5 },
                    { name: "佐藤 花子",  role: "Member", done: 5, total: 6 },
                    { name: "鈴木 一郎",  role: "Member", done: 1, total: 4 },
                  ].map((m) => {
                    const pct = Math.round((m.done / m.total) * 100);
                    return (
                      <div key={m.name} className="rounded-xl border bg-card p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-sm font-medium text-foreground">{m.name}</p>
                            <p className="text-xs text-muted-foreground">{m.role}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">{m.done}/{m.total}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted">
                          <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
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

      {/* CTA */}
      <section id="cta" className="py-28">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-4xl font-bold tracking-tight text-foreground">
            今すぐ始めよう
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            無料でアカウントを作成し、チームのタスクをツリーで整理しましょう。
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              無料アカウントを作成 <ArrowRight size={15} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg border px-8 py-3.5 text-sm font-semibold text-foreground transition hover:bg-accent"
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
