import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

const MOCK_MEMBERS = [
  { id: "1", name: "田中 太郎",  role: "Frontend",   tasks: 4, done: 2 },
  { id: "2", name: "佐藤 花子",  role: "Backend",    tasks: 6, done: 5 },
  { id: "3", name: "鈴木 一郎",  role: "Design",     tasks: 3, done: 1 },
];

const MOCK_SHARED = [
  { id: "1", text: "スプリントレビューの準備", assignee: "田中 太郎", status: "in_progress" as const },
  { id: "2", text: "APIドキュメントの更新",    assignee: "佐藤 花子", status: "done"        as const },
  { id: "3", text: "UIコンポーネント整備",     assignee: "鈴木 一郎", status: "pending"     as const },
];

export default function TeamSpacePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">チームスペース</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          チームのタスクとメンバーを確認します
        </p>
      </div>

      {/* Members */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          メンバー
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {MOCK_MEMBERS.map((m) => {
            const pct = m.tasks > 0 ? Math.round((m.done / m.tasks) * 100) : 0;
            return (
              <Card key={m.id}>
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Users size={14} />
                  </div>
                  <div>
                    <CardTitle className="text-sm">{m.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{m.role}</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-1.5 text-xs text-muted-foreground">
                    {m.done} / {m.tasks} タスク完了
                  </p>
                  <div className="h-1.5 w-full rounded-full bg-secondary">
                    <div
                      className="h-1.5 rounded-full bg-primary"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Shared tasks */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          共有タスク
        </h2>
        <Card>
          <ul className="divide-y">
            {MOCK_SHARED.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50">
                <span className="flex-1 text-sm">{t.text}</span>
                <span className="text-xs text-muted-foreground">{t.assignee}</span>
                <StatusBadge status={t.status} />
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}
