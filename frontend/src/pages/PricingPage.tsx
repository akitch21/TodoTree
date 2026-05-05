import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Construction, Sparkles } from "lucide-react";
import LandingLayout from "@/components/layout/LandingLayout";

const FEATURES = [
  "プロジェクト作成（無制限）",
  "タスクのツリー構造管理",
  "カンバン・リスト・ツリービュー",
  "グローバル検索（⌘K）",
  "チームメンバー招待・管理",
  "個人タスク管理",
  "期限・担当者の設定",
  "ダッシュボード統計",
];

export default function PricingPage() {
  return (
    <LandingLayout>
      {/* Header */}
      <section className="pt-32 pb-16 text-center px-6">
        <div className="inline-flex items-center gap-2 rounded-full border bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 mb-6">
          <Construction size={12} /> 開発プレビュー版
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          シンプルな料金体系
        </h1>
        <p className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto">
          現在は開発プレビュー版のため、すべての機能を<strong className="text-foreground">完全無料</strong>でご利用いただけます。
        </p>
      </section>

      {/* Pricing card */}
      <section className="pb-24 px-6">
        <div className="mx-auto max-w-lg">
          <div className="relative rounded-3xl border-2 border-primary bg-card shadow-2xl shadow-primary/10 overflow-hidden">
            {/* Badge */}
            <div className="absolute top-5 right-5 flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
              <Sparkles size={11} /> 期間限定 無料
            </div>

            <div className="p-8 pb-6">
              <p className="text-sm font-medium text-muted-foreground">開発プレビュー</p>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-6xl font-extrabold tracking-tight text-foreground">¥0</span>
                <span className="mb-2 text-muted-foreground">/ 月</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground leading-6">
                正式リリース後の料金プランは未定です。プレビュー期間中にご登録いただいたユーザーへの特典を検討中です。
              </p>

              <Link
                to="/signup"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                無料で始める <ArrowRight size={15} />
              </Link>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                クレジットカード不要 · 登録30秒
              </p>
            </div>

            {/* Feature list */}
            <div className="border-t px-8 py-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                含まれる機能
              </p>
              <ul className="space-y-3">
                {FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-foreground">
                    <CheckCircle2 size={15} className="shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Notice */}
          <div className="mt-6 rounded-2xl border bg-muted/50 p-5 text-sm text-muted-foreground leading-6">
            <p className="font-medium text-foreground mb-1">今後の料金プランについて</p>
            正式リリース時には有料プランを導入する予定ですが、現時点では未定です。プレビュー期間終了の際は事前にお知らせします。
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-24 px-6">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-foreground text-center mb-10">
            よくある質問
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "クレジットカードの登録は必要ですか？",
                a: "不要です。メールアドレスとパスワードだけで登録できます。",
              },
              {
                q: "開発プレビュー版はいつまで無料ですか？",
                a: "現時点では終了日は未定です。変更の際は登録メールアドレスへ事前にご連絡します。",
              },
              {
                q: "正式リリース後、データはどうなりますか？",
                a: "プレビュー期間中に作成したプロジェクト・タスクは正式版でも引き続き利用できる予定です。",
              },
              {
                q: "チームで使う場合も無料ですか？",
                a: "はい、プレビュー期間中はメンバー数に関わらず無料でご利用いただけます。",
              },
            ].map(({ q, a }) => (
              <div key={q} className="rounded-2xl border bg-card p-5">
                <p className="font-medium text-foreground">{q}</p>
                <p className="mt-2 text-sm text-muted-foreground leading-6">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </LandingLayout>
  );
}
