import { useState, useEffect, useCallback } from "react";
import { UserPlus, Trash2, Mail, Clock, X, Loader2, Check, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────

interface MemberUser {
  id: string;
  name: string;
  email: string;
}

export interface ApiMember {
  id: string;
  user_id: string;
  user: MemberUser;
  role: "owner" | "admin" | "member";
  created_at: string;
}

interface ApiInvitation {
  id: string;
  email: string;
  role: "owner" | "admin" | "member";
  status: "pending" | "accepted" | "expired" | "revoked";
  expires_at: string;
  created_at: string;
}

// Legacy export — kept so ProjectDetailPage import doesn't break
export type MemberRole = "owner" | "admin" | "member";
export interface ProjectMember {
  user: { id: string; name: string; email: string };
  role: MemberRole;
}

interface Props {
  projectId: string;
  currentUserId: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  owner:  "オーナー",
  admin:  "管理者",
  member: "メンバー",
};

const ROLE_COLORS: Record<string, string> = {
  owner:  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  admin:  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  member: "bg-muted text-muted-foreground",
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function MemberEditor({ projectId, currentUserId }: Props) {
  const [members,     setMembers]     = useState<ApiMember[]>([]);
  const [invitations, setInvitations] = useState<ApiInvitation[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  // Invite form state
  const [inviteEmail,   setInviteEmail]   = useState("");
  const [inviteRole,    setInviteRole]    = useState<"admin" | "member">("member");
  const [inviting,      setInviting]      = useState(false);
  const [inviteError,   setInviteError]   = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Current user's role in this project
  const currentMember = members.find((m) => m.user_id === currentUserId);
  const canManage = currentMember?.role === "owner" || currentMember?.role === "admin";

  // ── Data fetching ────────────────────────────────────────────────────────────

  const fetchMembers = useCallback(async () => {
    const { data } = await api.get(`/api/projects/${projectId}`);
    setMembers(data.members ?? []);
  }, [projectId]);

  const fetchInvitations = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/projects/${projectId}/invitations`);
      setInvitations(data);
    } catch {
      // 403 for non-admin users — just show empty list
      setInvitations([]);
    }
  }, [projectId]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([fetchMembers(), fetchInvitations()])
      .catch(() => setError("メンバー情報の取得に失敗しました"))
      .finally(() => setLoading(false));
  }, [fetchMembers, fetchInvitations]);

  // ── Mutations ────────────────────────────────────────────────────────────────

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    setInviteError(null);
    setInviteSuccess(false);
    try {
      await api.post(`/api/projects/${projectId}/invitations`, {
        email: inviteEmail.trim(),
        role:  inviteRole,
      });
      setInviteEmail("");
      setInviteSuccess(true);
      await fetchInvitations();
      setTimeout(() => setInviteSuccess(false), 3000);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;
      setInviteError(detail ?? "招待の送信に失敗しました");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await api.delete(`/api/projects/${projectId}/members/${memberId}`);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch {
      setError("メンバーの削除に失敗しました");
    }
  };

  const handleRevokeInvitation = async (invId: string) => {
    try {
      await api.delete(`/api/projects/${projectId}/invitations/${invId}`);
      await fetchInvitations();
    } catch {
      setError("招待の取り消しに失敗しました");
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">読み込み中...</span>
      </div>
    );
  }

  const pendingInvitations = invitations.filter((i) => i.status === "pending");

  return (
    <div className="flex flex-col gap-8">

      {/* Global error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* ── Invite form (owner / admin only) ─────────────────────────────── */}
      {canManage && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">メンバーを招待</h2>
          <form onSubmit={handleInvite} className="flex flex-col gap-2">
            <div className="flex gap-2">
              {/* Email input */}
              <div className="relative flex-1">
                <Mail
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => { setInviteEmail(e.target.value); setInviteError(null); }}
                  placeholder="メールアドレスを入力..."
                  className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
                />
              </div>

              {/* Role selector */}
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as "admin" | "member")}
                className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="member">メンバー</option>
                <option value="admin">管理者</option>
              </select>

              {/* Submit */}
              <button
                type="submit"
                disabled={inviting || !inviteEmail.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                {inviting
                  ? <Loader2 size={13} className="animate-spin" />
                  : <UserPlus size={13} />}
                招待
              </button>
            </div>

            {inviteError && (
              <p className="text-xs text-destructive">{inviteError}</p>
            )}
            {inviteSuccess && (
              <p className="flex items-center gap-1 text-xs text-primary">
                <Check size={12} /> 招待メールを送信しました
              </p>
            )}
          </form>
        </section>
      )}

      {/* ── Members list ─────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">
          現在のメンバー（{members.length}人）
        </h2>

        {members.length === 0 ? (
          <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
            メンバーがいません
          </div>
        ) : (
          <ul className="divide-y rounded-lg border overflow-hidden">
            {members.map((member) => {
              const isCurrentUser = member.user_id === currentUserId;
              const isOwner       = member.role === "owner";
              const canRemove     = canManage && !isOwner && !isCurrentUser;

              return (
                <li key={member.id} className="flex items-center gap-3 bg-card px-4 py-3">
                  {/* Avatar */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                    {member.user.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {member.user.name}
                      {isCurrentUser && (
                        <span className="ml-1 text-xs text-muted-foreground font-normal">
                          （あなた）
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {member.user.email}
                    </p>
                  </div>

                  {/* Role badge */}
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[member.role]}`}>
                    {ROLE_LABELS[member.role]}
                  </span>

                  {/* Remove button */}
                  {canRemove && (
                    <button
                      title="メンバーを削除"
                      onClick={() => handleRemoveMember(member.id)}
                      className="shrink-0 rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ── Pending invitations (owner / admin only) ─────────────────────── */}
      {canManage && pendingInvitations.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">
            招待中（{pendingInvitations.length}件）
          </h2>
          <ul className="divide-y rounded-lg border overflow-hidden">
            {pendingInvitations.map((inv) => (
              <li key={inv.id} className="flex items-center gap-3 bg-card px-4 py-3">
                {/* Icon */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                  <Clock size={14} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {ROLE_LABELS[inv.role]} として招待中
                  </p>
                </div>

                {/* Status badge */}
                <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                  承認待ち
                </span>

                {/* Revoke button */}
                <button
                  title="招待を取り消す"
                  onClick={() => handleRevokeInvitation(inv.id)}
                  className="shrink-0 rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive transition-colors"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
