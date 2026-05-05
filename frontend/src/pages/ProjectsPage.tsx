import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  FolderOpen,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { useProjects, projectStats } from "@/hooks/useProjects";
import { api } from "@/lib/api";

interface MyInvitation {
  id: string;
  project_id: string;
  project_name: string;
  email: string;
  role: "owner" | "admin" | "member";
  token: string;
  expires_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  owner: "オーナー",
  admin: "管理者",
  member: "メンバー",
};

// ── Page ──────────────────────────────────────────────────────
export default function ProjectsPage() {
  const { projects, loading, error, addProject, updateProject, refetch } = useProjects();
  const [showModal,       setShowModal]       = useState(false);
  const [searchQuery,     setSearchQuery]     = useState("");
  const [showCompleted,   setShowCompleted]   = useState(false);
  const [invitations, setInvitations] = useState<MyInvitation[]>([]);
  const [invitationLoading, setInvitationLoading] = useState(true);
  const [invitationError, setInvitationError] = useState<string | null>(null);
  const [acceptingInvitationId, setAcceptingInvitationId] = useState<string | null>(null);

  const fetchInvitations = async () => {
    setInvitationError(null);
    try {
      const { data } = await api.get<MyInvitation[]>("/api/invitations/me");
      setInvitations(data);
    } catch {
      setInvitationError("招待の取得に失敗しました");
    } finally {
      setInvitationLoading(false);
    }
  };

  useEffect(() => {
    void fetchInvitations();
  }, []);

  const acceptInvitation = async (invitation: MyInvitation) => {
    setAcceptingInvitationId(invitation.id);
    setInvitationError(null);
    try {
      await api.post(`/api/invitations/${invitation.token}/accept`);
      setInvitations((prev) => prev.filter((item) => item.id !== invitation.id));
      await refetch();
    } catch {
      setInvitationError("招待の承認に失敗しました。招待の状態を確認してください。");
    } finally {
      setAcceptingInvitationId(null);
    }
  };

  // 検索フィルター適用後に完了 / 未完了で分離
  const allFiltered = searchQuery.trim()
    ? projects.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : projects;

  const filtered          = allFiltered.filter((p) => p.status !== "done");
  const completedFiltered = allFiltered.filter((p) => p.status === "done");

  const handleComplete = (id: string) => {
    void updateProject(id, { status: "done" });
  };

  const handleReopen = (id: string) => {
    void updateProject(id, { status: "in_progress" });
  };

  const handleCreate = async (name: string, description: string) => {
    await addProject(name, description);
    setShowModal(false);
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
      読み込み中...
    </div>
  );

  if (error) return (
    <div className="flex h-64 items-center justify-center text-sm text-destructive">
      {error}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">プロジェクト</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {projects.filter((p) => p.status !== "done").length} 件のアクティブなプロジェクト
            {completedFiltered.length > 0 && (
              <span className="ml-1.5 text-xs text-muted-foreground/70">
                （完了済み {projects.filter((p) => p.status === "done").length} 件）
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          data-testid="new-project-button"
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus size={15} />
          新規プロジェクト
        </button>
      </div>

      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="プロジェクトを検索..."
          className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Pending invitations addressed to the current user */}
      {(invitationLoading || invitationError || invitations.length > 0) && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            招待中のプロジェクト
          </h2>
          <Card>
            {invitationLoading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-5 text-sm text-muted-foreground">
                <Loader2 size={14} className="animate-spin" />
                招待を確認中...
              </div>
            ) : invitationError ? (
              <div className="flex items-center gap-2 px-4 py-4 text-sm text-destructive">
                <AlertCircle size={14} />
                {invitationError}
              </div>
            ) : (
              <ul className="divide-y">
                {invitations.map((invitation) => (
                  <li key={invitation.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Clock size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{invitation.project_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {ROLE_LABELS[invitation.role]} として招待されています
                      </p>
                    </div>
                    <button
                      onClick={() => void acceptInvitation(invitation)}
                      disabled={acceptingInvitationId === invitation.id}
                      className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40"
                    >
                      {acceptingInvitationId === invitation.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Check size={12} />
                      )}
                      承認
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>
      )}

      {/* Active projects grid */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
          {searchQuery
            ? "\"" + searchQuery + "\" に一致するプロジェクトが見つかりません。"
            : "プロジェクトがありません。「新規プロジェクト」から作成してください。"}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const { total: taskCount, done: doneCount } = projectStats(p);
            const progress = taskCount > 0
              ? Math.round((doneCount / taskCount) * 100)
              : 0;
            return (
              <div key={p.id} className="group relative">
                <Link to={"/projects/" + p.id} data-testid="project-card" data-project-name={p.name}>
                  <Card className="h-full cursor-pointer transition-all hover:shadow-md group-hover:border-primary/40">
                    <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <FolderOpen
                          size={15}
                          className="mt-0.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors"
                        />
                        <CardTitle className="text-sm leading-snug">{p.name}</CardTitle>
                      </div>
                      <StatusBadge status={p.status} />
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                      {p.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {p.description}
                        </p>
                      )}
                      <div>
                        <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{doneCount} / {taskCount} タスク完了</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-secondary">
                          <div
                            className="h-1.5 rounded-full bg-primary transition-all duration-500"
                            style={{ width: progress + "%" }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                {/* 完了ボタン（モバイルは常時表示、デスクトップはhover時） */}
                <button
                  onClick={(e) => { e.preventDefault(); handleComplete(p.id); }}
                  className="absolute bottom-3 right-3 flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground sm:opacity-0 sm:group-hover:opacity-100 hover:text-primary hover:border-primary/40 transition-all"
                >
                  <CheckCircle2 size={11} />
                  完了にする
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Completed projects section */}
      {completedFiltered.length > 0 && (
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setShowCompleted((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-fit"
          >
            {showCompleted
              ? <ChevronDown size={15} />
              : <ChevronRight size={15} />}
            完了済みプロジェクト（{completedFiltered.length} 件）
          </button>

          {showCompleted && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {completedFiltered.map((p) => {
                const { total: taskCount, done: doneCount } = projectStats(p);
                const progress = taskCount > 0
                  ? Math.round((doneCount / taskCount) * 100)
                  : 0;
                return (
                  <div key={p.id} className="group relative">
                    <Link to={"/projects/" + p.id}>
                      <Card className="h-full cursor-pointer opacity-60 hover:opacity-100 transition-all hover:shadow-md">
                        <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                          <div className="flex items-start gap-2 min-w-0">
                            <CheckCircle2
                              size={15}
                              className="mt-0.5 shrink-0 text-primary"
                            />
                            <CardTitle className="text-sm leading-snug line-through text-muted-foreground">
                              {p.name}
                            </CardTitle>
                          </div>
                          <StatusBadge status={p.status} />
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                          {p.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {p.description}
                            </p>
                          )}
                          <div>
                            <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                              <span>{doneCount} / {taskCount} タスク完了</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-secondary">
                              <div
                                className="h-1.5 rounded-full bg-primary transition-all duration-500"
                                style={{ width: progress + "%" }}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                    {/* 再開するボタン（モバイルは常時表示、デスクトップはhover時） */}
                    <button
                      onClick={(e) => { e.preventDefault(); handleReopen(p.id); }}
                      className="absolute bottom-3 right-3 flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground sm:opacity-0 sm:group-hover:opacity-100 hover:text-primary hover:border-primary/40 transition-all"
                    >
                      <RotateCcw size={11} />
                      再開する
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* New Project Modal */}
      {showModal && (
        <NewProjectModal
          onCreate={handleCreate}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

// ── NewProjectModal ────────────────────────────────────────────
function NewProjectModal({
  onCreate, onClose,
}: {
  onCreate: (name: string, description: string) => Promise<void>;
  onClose:  () => void;
}) {
  const [name,      setName]      = useState("");
  const [desc,      setDesc]      = useState("");
  const [nameError, setNameError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setNameError("プロジェクト名は必須です"); return; }
    await onCreate(name.trim(), desc.trim());
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">新規プロジェクト</h2>
            <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-accent">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                プロジェクト名 <span className="text-destructive">*</span>
              </label>
              <input
                ref={inputRef}
                data-testid="project-name-input"
                value={name}
                onChange={(e) => { setName(e.target.value); setNameError(""); }}
                placeholder="例: ToDoTree バックエンド実装"
                maxLength={60}
                className="input-base"
              />
              <div className="flex justify-between">
                {nameError && <p className="text-xs text-destructive">{nameError}</p>}
                <span className="ml-auto text-[10px] text-muted-foreground">{name.length}/60</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">説明（任意）</label>
              <textarea
                data-testid="project-description-input"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="プロジェクトの概要を入力..."
                rows={3}
                maxLength={200}
                className="input-base resize-none text-sm"
              />
              <span className="ml-auto text-[10px] text-muted-foreground">{desc.length}/200</span>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border py-2 text-sm font-medium hover:bg-accent transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                data-testid="project-create-submit"
                className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
              >
                作成
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
