/**
 * Dashboard お知らせ用の定数データ。
 *
 * - フロントエンドにハードコードされたデータ。
 * - 表示は新しい順、ダッシュボードで最大5件まで表示する。
 * - level: "info" | "important" で UI の差し色が変わる。
 * - link が指定されていればクリックで遷移。
 *
 * 後で API 化する場合は、このモジュールを差し替えれば良い。
 */

export type AnnouncementLevel = "info" | "important" | "release";

export interface Announcement {
  id:        string;
  title:     string;
  body?:     string;
  /** ISO 文字列（YYYY-MM-DD or full ISO） */
  date:      string;
  level:     AnnouncementLevel;
  link?:     string;
}

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id:    "ann-2026-05-08",
    title: "ログイン不要のデモを公開しました",
    body:  "アカウント登録なしで、サンプルデータでToDoTreeの操作感を試せるようになりました。ランディングページの「デモを試す」からお試しください。",
    date:  "2026-05-08",
    level: "release",
    link:  "/demo",
  },
  {
    id:    "ann-2026-05-07",
    title: "カンバンビューでドラッグ&ドロップに対応",
    body:  "タスクをカード単位でドラッグして列を移動できるようになりました。キーボードでも操作可能です。",
    date:  "2026-05-07",
    level: "release",
  },
  {
    id:    "ann-2026-05-06",
    title: "プロジェクトのツリービューでマウスホイールズームを有効化",
    body:  "ツリーが大きくなっても全体を見渡しやすくなりました。ホイールでズームイン/アウトできます。",
    date:  "2026-05-06",
    level: "info",
  },
  {
    id:    "ann-2026-05-05",
    title: "起票者は「プロジェクトメンバー」から選択する仕様になりました",
    body:  "従来のハードコードユーザーは廃止され、参加メンバーのみが起票者として選択可能になりました。自分がメンバーの場合は「（自分）」と表示されます。",
    date:  "2026-05-05",
    level: "info",
  },
  {
    id:    "ann-2026-05-04",
    title: "メンテナンスのお知らせ（5/12 02:00–03:00 JST）",
    body:  "ToDoTree のインフラ更新に伴い、上記時間帯にサービスが一時的に利用できなくなる可能性があります。",
    date:  "2026-05-04",
    level: "important",
  },
  // 6件目以降を追加してもダッシュボードでは最初の5件のみ表示される
];

/** ダッシュボードに表示する最大件数 */
export const DASHBOARD_ANNOUNCEMENT_LIMIT = 5;

export function getDashboardAnnouncements(): Announcement[] {
  return [...ANNOUNCEMENTS]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, DASHBOARD_ANNOUNCEMENT_LIMIT);
}
