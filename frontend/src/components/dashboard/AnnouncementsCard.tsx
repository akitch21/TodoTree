import { Link } from "react-router-dom";
import {
  Megaphone, AlertTriangle, Sparkles, Info, ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getDashboardAnnouncements,
  type Announcement,
} from "@/lib/announcements";

/**
 * Dashboard お知らせ枠
 * 最大 DASHBOARD_ANNOUNCEMENT_LIMIT 件まで表示。
 * level に応じて差し色とアイコンを切り替える。
 */
export function AnnouncementsCard() {
  const items = getDashboardAnnouncements();

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2">
        <Megaphone size={15} className="text-primary" />
        <h2 className="text-sm font-semibold">お知らせ</h2>
        {items.length > 0 && (
          <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {items.length}件
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">
          お知らせはありません
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((a) => (
            <AnnouncementRow key={a.id} item={a} />
          ))}
        </ul>
      )}
    </div>
  );
}

function AnnouncementRow({ item }: { item: Announcement }) {
  const tone = TONE[item.level];
  const Wrapper: React.ElementType = item.link ? Link : "div";
  const wrapperProps = item.link
    ? { to: item.link }
    : {};

  return (
    <li>
      <Wrapper
        {...wrapperProps}
        className={cn(
          "group flex items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-colors",
          tone.row,
          item.link && "hover:border-primary/40 hover:bg-accent/40 cursor-pointer"
        )}
      >
        <span className={cn("mt-0.5 shrink-0", tone.icon)}>
          {tone.Icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", tone.badge)}>
              {tone.label}
            </span>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {formatDate(item.date)}
            </span>
            {item.link && (
              <ArrowUpRight
                size={12}
                className="ml-auto shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
              />
            )}
          </div>
          <p className="mt-1 text-sm font-medium leading-snug text-foreground">
            {item.title}
          </p>
          {item.body && (
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground line-clamp-2">
              {item.body}
            </p>
          )}
        </div>
      </Wrapper>
    </li>
  );
}

const TONE: Record<
  Announcement["level"],
  { Icon: React.ReactNode; row: string; icon: string; badge: string; label: string }
> = {
  info: {
    Icon: <Info size={14} />,
    row:   "border-border bg-background",
    icon:  "text-blue-500",
    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
    label: "お知らせ",
  },
  important: {
    Icon: <AlertTriangle size={14} />,
    row:   "border-amber-300/40 bg-amber-50/40 dark:bg-amber-950/20",
    icon:  "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    label: "重要",
  },
  release: {
    Icon: <Sparkles size={14} />,
    row:   "border-primary/30 bg-primary/5",
    icon:  "text-primary",
    badge: "bg-primary/10 text-primary",
    label: "新機能",
  },
};

function formatDate(iso: string): string {
  const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
  if (Number.isNaN(d.getTime())) return iso;
  const m  = (d.getMonth() + 1).toString().padStart(2, "0");
  const dd = d.getDate().toString().padStart(2, "0");
  return `${d.getFullYear()}/${m}/${dd}`;
}
