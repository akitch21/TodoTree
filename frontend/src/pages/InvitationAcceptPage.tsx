import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, XCircle, Clock, Loader2, FolderOpen, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/store/AuthContext";

// ── Types ──────────────────────────────────────────────────────────────────────

interface InvitationPreview {
  id: string;
  email: string;
  role: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  expires_at: string;
  project_name: string;
}

interface InvitationAcceptResponse {
  project_id: string;
  project_name?: string;
}

type PageState =
  | { kind: "loading" }
  | { kind: "not_found" }
  | { kind: "invalid"; reason: "expired" | "already_used" | "revoked"; preview: InvitationPreview }
  | { kind: "preview"; preview: InvitationPreview }
  | { kind: "accepting" }
  | { kind: "success"; projectId: string; projectName: string }
  | { kind: "error"; message: string };

const ROLE_LABELS: Record<string, string> = {
  owner:  "オーナー",
  admin:  "管理者",
  member: "メンバー",
};

// ── Page ───────────────────────────────────────────────────────────────────────

export default function InvitationAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<PageState>({ kind: "loading" });

  // 1. Fetch invitation preview on mount
  useEffect(() => {
    if (!token) { setState({ kind: "not_found" }); return; }

    api.get<InvitationPreview>(`/api/invitations/${token}`)
      .then(({ data }) => {
        if (data.status === "expired") {
          setState({ kind: "invalid", reason: "expired",      preview: data });
        } else if (data.status === "accepted") {
          setState({ kind: "invalid", reason: "already_used", preview: data });
        } else if (data.status === "revoked") {
          setState({ kind: "invalid", reason: "revoked",      preview: data });
        } else {
          setState({ kind: "preview", preview: data });
        }
      })
      .catch((err) => {
        if (err?.response?.status === 404) setState({ kind: "not_found" });
        else setState({ kind: "error", message: "招待情報の取得に失敗しました" });
      });
  }, [token]);

  // 2. Accept handler (called when logged-in user clicks 承認する)
  const handleAccept = async () => {
    if (!token) return;
    setState({ kind: "accepting" });
    try {
      const { data: accepted } = await api.post<InvitationAcceptResponse>(`/api/invitations/${token}/accept`);
      const projectName = state.kind === "preview" ? state.preview.project_name : accepted.project_name ?? "";
      setState({ kind: "success", projectId: accepted.project_id, projectName });
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;
      if (detail?.includes("email")) {
        setState({
          kind: "error",
          message: `この招待は ${(state as { preview?: InvitationPreview }).preview?.email} 宛です。正しいアカウントでログインしてください。`,
        });
      } else {
        setState({ kind: "error", message: detail ?? "承認に失敗しました" });
      }
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link to="/" className="text-2xl font-bold tracking-tight">
            ToDoTree
          </Link>
        </div>

        <div className="rounded-2xl border bg-card p-8 shadow-sm">
          {/* Loading */}
          {state.kind === "loading" && (
            <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
              <Loader2 size={28} className="animate-spin" />
              <p className="text-sm">招待情報を読み込み中...</p>
            </div>
          )}

          {/* Accepting */}
          {state.kind === "accepting" && (
            <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
              <Loader2 size={28} className="animate-spin" />
              <p className="text-sm">承認中...</p>
            </div>
          )}

          {/* Not found */}
          {state.kind === "not_found" && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <XCircle size={40} className="text-destructive" />
              <div>
                <h2 className="text-base font-semibold">招待が見つかりません</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  リンクが無効か、すでに削除されています。
                </p>
              </div>
              <Link
                to="/dashboard"
                className="text-sm font-medium text-primary hover:underline"
              >
                ダッシュボードへ
              </Link>
            </div>
          )}

          {/* Invalid (expired / already_used / revoked) */}
          {state.kind === "invalid" && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              {state.reason === "expired"
                ? <Clock size={40} className="text-amber-500" />
                : <XCircle size={40} className="text-destructive" />}
              <div>
                <h2 className="text-base font-semibold">
                  {state.reason === "expired"    && "招待の有効期限が切れています"}
                  {state.reason === "already_used" && "この招待はすでに使用済みです"}
                  {state.reason === "revoked"    && "この招待は取り消されました"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  プロジェクト「{state.preview.project_name}」への招待です。
                  オーナーに再招待を依頼してください。
                </p>
              </div>
              <Link
                to="/dashboard"
                className="text-sm font-medium text-primary hover:underline"
              >
                ダッシュボードへ
              </Link>
            </div>
          )}

          {/* Preview — pending invitation */}
          {state.kind === "preview" && (
            <div className="flex flex-col gap-6">
              {/* Header */}
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <FolderOpen size={24} className="text-primary" />
                </div>
                <h2 className="text-lg font-semibold">プロジェクトへの招待</h2>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {state.preview.project_name}
                  </span>{" "}
                  に{" "}
                  <span className="font-medium text-foreground">
                    {ROLE_LABELS[state.preview.role] ?? state.preview.role}
                  </span>{" "}
                  として招待されています。
                </p>
              </div>

              {/* Invitation detail card */}
              <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">招待先メール</span>
                  <span className="font-medium">{state.preview.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ロール</span>
                  <span className="font-medium">
                    {ROLE_LABELS[state.preview.role] ?? state.preview.role}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">有効期限</span>
                  <span className="font-medium">
                    {new Date(state.preview.expires_at).toLocaleDateString("ja-JP")}
                  </span>
                </div>
              </div>

              {/* CTA based on auth state */}
              {isAuthenticated ? (
                <div className="flex flex-col gap-3">
                  {/* Email mismatch warning */}
                  {user?.email?.toLowerCase() !== state.preview.email.toLowerCase() && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                      <AlertCircle size={13} className="mt-0.5 shrink-0" />
                      <span>
                        現在のアカウント（{user?.email}）はこの招待のメールアドレスと異なります。
                        正しいアカウントでログインし直してください。
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => void handleAccept()}
                    disabled={user?.email?.toLowerCase() !== state.preview.email.toLowerCase()}
                    className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-opacity"
                  >
                    招待を承認する
                  </button>
                  <p className="text-center text-xs text-muted-foreground">
                    {user?.name}（{user?.email}）としてログイン中
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-center text-sm text-muted-foreground">
                    承認するにはログインが必要です。
                  </p>
                  <Link
                    to={`/login?redirect=/invitations/${token}`}
                    className="block w-full rounded-lg bg-primary py-2.5 text-center text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    ログインして承認
                  </Link>
                  <Link
                    to={`/signup?redirect=/invitations/${token}`}
                    className="block w-full rounded-lg border py-2.5 text-center text-sm font-medium hover:bg-accent transition-colors"
                  >
                    新規登録して承認
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Success */}
          {state.kind === "success" && (
            <div className="flex flex-col items-center gap-5 py-4 text-center">
              <CheckCircle2 size={44} className="text-primary" />
              <div>
                <h2 className="text-base font-semibold">承認しました！</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  「{state.projectName}」のメンバーになりました。
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full">
                <button
                  onClick={() => navigate(state.projectId ? `/projects/${state.projectId}` : "/projects")}
                  className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  プロジェクトを開く
                </button>
              </div>
            </div>
          )}

          {/* Generic error */}
          {state.kind === "error" && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <XCircle size={40} className="text-destructive" />
              <div>
                <h2 className="text-base font-semibold">エラーが発生しました</h2>
                <p className="mt-1 text-sm text-muted-foreground">{state.message}</p>
              </div>
              <Link
                to="/dashboard"
                className="text-sm font-medium text-primary hover:underline"
              >
                ダッシュボードへ
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
