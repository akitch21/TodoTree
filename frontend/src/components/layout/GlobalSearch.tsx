import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FolderOpen, ListTodo, Search, X, CheckCircle2, Circle, Clock } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { usePersonalTasks } from "@/hooks/usePersonalTasks";
import { flattenTasks } from "@/lib/taskTree";
import type { TaskStatus } from "@/types";

// ── Result types ──────────────────────────────────────────────────────────────

type ResultKind = "project" | "task" | "personal";

interface SearchResult {
  id:          string;
  kind:        ResultKind;
  title:       string;
  subtitle:    string;
  status?:     TaskStatus;
  href:        string;
}

// ── Status icon ───────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status?: TaskStatus }) {
  if (!status) return null;
  if (status === "done")        return <CheckCircle2 size={12} className="shrink-0 text-primary"          />;
  if (status === "in_progress") return <Clock        size={12} className="shrink-0 text-amber-500"        />;
  return                               <Circle       size={12} className="shrink-0 text-muted-foreground" />;
}

// ── Kind icon ─────────────────────────────────────────────────────────────────

function KindIcon({ kind }: { kind: ResultKind }) {
  if (kind === "project") return <FolderOpen size={14} className="shrink-0 text-muted-foreground" />;
  return                         <ListTodo   size={14} className="shrink-0 text-muted-foreground" />;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface GlobalSearchProps {
  open:    boolean;
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const [query, setQuery]   = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef            = useRef<HTMLInputElement>(null);
  const listRef             = useRef<HTMLDivElement>(null);
  const navigate            = useNavigate();

  const { projects }     = useProjects();
  const { tasks: personalTasks } = usePersonalTasks();

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Build all results
  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const out: SearchResult[] = [];

    // Projects
    for (const p of projects) {
      if (
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      ) {
        out.push({
          id:       "proj-" + p.id,
          kind:     "project",
          title:    p.name,
          subtitle: p.description ?? "プロジェクト",
          status:   p.status,
          href:     "/projects/" + p.id,
        });
      }
    }

    // Tasks in projects
    for (const p of projects) {
      for (const t of flattenTasks(p.tasks)) {
        if (
          t.text.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
        ) {
          out.push({
            id:       "ptask-" + t.id,
            kind:     "task",
            title:    t.text,
            subtitle: p.name,
            status:   t.status,
            href:     "/projects/" + p.id,
          });
        }
      }
    }

    // Personal tasks
    for (const t of personalTasks) {
      if (
        t.text.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      ) {
        out.push({
          id:       "pers-" + t.id,
          kind:     "personal",
          title:    t.text,
          subtitle: "個人タスク",
          status:   t.status,
          href:     "/tasks",
        });
      }
    }

    return out.slice(0, 20);
  }, [query, projects, personalTasks]);

  // Clamp cursor when results change
  useEffect(() => {
    setCursor((c) => Math.min(c, Math.max(0, results.length - 1)));
  }, [results.length]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>("[data-active='true']");
    el?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  const go = useCallback((href: string) => {
    navigate(href);
    onClose();
  }, [navigate, onClose]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(c + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
    if (e.key === "Enter" && results[cursor]) go(results[cursor].href);
    if (e.key === "Escape") onClose();
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-x-0 top-[15%] z-50 mx-auto w-full max-w-xl px-4">
        <div className="flex flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl">

          {/* Search input */}
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <Search size={16} className="shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setCursor(0); }}
              onKeyDown={handleKeyDown}
              placeholder="プロジェクト・タスクを検索..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            )}
            <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground sm:block">
              Esc
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[360px] overflow-y-auto py-2">
            {query.trim() === "" ? (
              <p className="px-4 py-8 text-center text-xs text-muted-foreground">
                キーワードを入力して検索
              </p>
            ) : results.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-muted-foreground">
                「{query}」に一致する結果が見つかりません
              </p>
            ) : (
              results.map((r, i) => (
                <button
                  key={r.id}
                  data-active={i === cursor}
                  onClick={() => go(r.href)}
                  onMouseEnter={() => setCursor(i)}
                  className={
                    "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors " +
                    (i === cursor ? "bg-accent" : "hover:bg-accent/50")
                  }
                >
                  <KindIcon kind={r.kind} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium">{r.title}</span>
                    <span className="truncate text-[11px] text-muted-foreground">{r.subtitle}</span>
                  </div>
                  <StatusIcon status={r.status} />
                </button>
              ))
            )}
          </div>

          {/* Footer hint */}
          {results.length > 0 && (
            <div className="flex items-center gap-3 border-t px-4 py-2 text-[10px] text-muted-foreground">
              <span><kbd className="rounded border bg-muted px-1 font-mono">↑↓</kbd> 移動</span>
              <span><kbd className="rounded border bg-muted px-1 font-mono">Enter</kbd> 開く</span>
              <span><kbd className="rounded border bg-muted px-1 font-mono">Esc</kbd> 閉じる</span>
              <span className="ml-auto">{results.length} 件</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
