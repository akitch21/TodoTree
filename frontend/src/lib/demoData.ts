/**
 * `/demo` ルート用のサンプルデータ。
 * - ログイン不要・API 通信なし。
 * - メモリ内 state を初期化するためだけに使われる。リロードで初期値に戻る。
 */
import type { Project, Reporter, Task } from "@/types";

const TODAY  = new Date();
const ymd = (offsetDays: number): string => {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};
const iso = (offsetDays: number): string => {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
};

export const DEMO_USERS: Reporter[] = [
  { id: "demo-u-1", name: "田中 太郎" },
  { id: "demo-u-2", name: "佐藤 花子" },
  { id: "demo-u-3", name: "鈴木 一郎" },
];

/** デモ画面でログインユーザーとして扱う仮ユーザー */
export const DEMO_CURRENT_USER: Reporter = DEMO_USERS[0];

function task(
  id: string,
  text: string,
  status: Task["status"],
  parentId: string | null,
  opts: Partial<Pick<Task, "description" | "dueDate" | "assignee" | "reporter" | "createdAt" | "extraDependencies">> = {},
): Task {
  return {
    id,
    text,
    status,
    parentId,
    children: [],
    createdAt: opts.createdAt ?? iso(-30),
    description: opts.description,
    dueDate: opts.dueDate,
    assignee: opts.assignee,
    reporter: opts.reporter ?? DEMO_CURRENT_USER,
    extraDependencies: opts.extraDependencies,
  };
}

/** flatをツリーに組み立てる（parentIdベース） */
export function buildTree(flat: Task[]): Task[] {
  const map = new Map<string, Task>();
  for (const t of flat) map.set(t.id, { ...t, children: [] });
  const roots: Task[] = [];
  for (const t of flat) {
    const node = map.get(t.id)!;
    if (t.parentId && map.has(t.parentId)) {
      map.get(t.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

// ── Project A: ToDoTree v1 リリース ────────────────────────────────────
const FLAT_PROJECT_A: Task[] = [
  task("dt-a-1", "UI設計", "done", null, {
    description: "Figmaでメイン画面のワイヤー〜デザインを完成させる",
    dueDate: ymd(-10), assignee: DEMO_USERS[1],
  }),
  task("dt-a-1-1", "ワイヤーフレーム作成", "done", "dt-a-1", { dueDate: ymd(-15), assignee: DEMO_USERS[1] }),
  task("dt-a-1-2", "デザインレビュー", "done", "dt-a-1",   { dueDate: ymd(-12), assignee: DEMO_USERS[2] }),

  task("dt-a-2", "バックエンド開発", "in_progress", null, {
    description: "FastAPI + PostgreSQL で API を実装", dueDate: ymd(5),
    assignee: DEMO_USERS[0],
  }),
  task("dt-a-2-1", "API設計", "done", "dt-a-2",       { dueDate: ymd(-5), assignee: DEMO_USERS[0] }),
  task("dt-a-2-2", "DB設計",  "in_progress", "dt-a-2", { dueDate: ymd(-1), assignee: DEMO_USERS[0] }),
  task("dt-a-2-3", "認証実装", "in_progress", "dt-a-2", { dueDate: ymd(2),  assignee: DEMO_USERS[2] }),

  task("dt-a-3", "テスト", "pending", null, {
    description: "ユニット + 統合 + E2E", dueDate: ymd(10),
    extraDependencies: ["dt-a-2"],
  }),
  task("dt-a-4", "本番デプロイ", "pending", null, {
    description: "Railway / Vercel への本番リリース", dueDate: ymd(14),
    extraDependencies: ["dt-a-3"],
  }),
];

const FLAT_PROJECT_B: Task[] = [
  task("dt-b-1", "ロゴリブランド", "done", null,         { dueDate: ymd(-2), assignee: DEMO_USERS[1] }),
  task("dt-b-2", "新カラーパレット策定", "in_progress", null, { dueDate: ymd(3),  assignee: DEMO_USERS[1] }),
  task("dt-b-3", "アイコンセット更新",   "pending", null,    { dueDate: ymd(7),  assignee: DEMO_USERS[2] }),
  task("dt-b-4", "ガイドライン整備",     "pending", null,    { dueDate: ymd(12) }),
  task("dt-b-5", "プレスリリース原稿",   "pending", null,    { dueDate: ymd(15), assignee: DEMO_USERS[0] }),
  task("dt-b-overdue", "旧サイトの差替え (期限超過)", "pending", null, {
    dueDate: ymd(-3),
    assignee: DEMO_USERS[2],
  }),
];

export const DEMO_PROJECTS: Project[] = [
  {
    id: "demo-p-A",
    name: "ToDoTree v1 リリース",
    description: "正式リリースに向けたメインプロジェクト",
    ownerId: DEMO_USERS[0].id,
    members: DEMO_USERS.map((u) => ({ id: u.id, name: u.name, email: u.name + "@example.com" })),
    tasks: buildTree(FLAT_PROJECT_A),
    createdAt: iso(-45),
  },
  {
    id: "demo-p-B",
    name: "リブランディング",
    description: "ロゴ・カラー・ガイドラインの刷新",
    ownerId: DEMO_USERS[1].id,
    members: [DEMO_USERS[0], DEMO_USERS[1], DEMO_USERS[2]].map((u) => ({
      id: u.id, name: u.name, email: u.name + "@example.com",
    })),
    tasks: buildTree(FLAT_PROJECT_B),
    createdAt: iso(-20),
  },
];
