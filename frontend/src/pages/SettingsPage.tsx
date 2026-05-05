import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/store/AuthContext";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [deleteEmail, setDeleteEmail] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleteError(null);
    setDeleting(true);
    try {
      await api.delete("/api/auth/me", { data: { email: deleteEmail.trim() } });
      logout();
      navigate("/login", { replace: true });
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;
      setDeleteError(detail ?? "退会処理に失敗しました");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">設定</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          アカウントとアプリの設定を管理します
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>プロフィール</CardTitle>
          <CardDescription>名前とメールアドレスを更新します</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">お名前</label>
            <input
              type="text"
              value={user?.name ?? ""}
              readOnly
              className="w-full max-w-sm rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">メールアドレス</label>
            <input
              type="email"
              value={user?.email ?? ""}
              readOnly
              className="w-full max-w-sm rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>通知</CardTitle>
          <CardDescription>通知の受け取り方を設定します</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-5 space-y-3">
          {[
            { id: "email", label: "メール通知", desc: "タスクの更新をメールで受け取る" },
            { id: "push",  label: "プッシュ通知", desc: "ブラウザのプッシュ通知を有効にする" },
          ].map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-primary" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">危険な操作</CardTitle>
          <CardDescription>この操作は取り消せません</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-5 space-y-4">
          <div className="space-y-2">
            <p className="max-w-xl text-sm text-muted-foreground">
              退会すると、メールアドレス、個人タスク、プロジェクト所属、あなた宛またはあなたが送信した招待が削除されます。
              あなたが唯一のオーナーで他メンバーがいないプロジェクトは削除されます。
            </p>
            <label className="block text-sm font-medium">
              確認のためメールアドレスを入力
            </label>
            <input
              type="email"
              value={deleteEmail}
              onChange={(e) => setDeleteEmail(e.target.value)}
              placeholder={user?.email ?? "you@example.com"}
              className="w-full max-w-sm rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {deleteError && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {deleteError}
            </p>
          )}
          <Button
            variant="destructive"
            size="sm"
            disabled={deleting || deleteEmail.trim().toLowerCase() !== user?.email?.toLowerCase()}
            onClick={() => void handleDeleteAccount()}
          >
            {deleting ? "退会処理中..." : "退会する"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
