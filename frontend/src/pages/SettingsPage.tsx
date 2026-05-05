import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
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
              defaultValue="山田 太郎"
              className="w-full max-w-sm rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">メールアドレス</label>
            <input
              type="email"
              defaultValue="yamada@example.com"
              className="w-full max-w-sm rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <Button size="sm">変更を保存</Button>
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
        <CardContent className="pt-5">
          <Button variant="destructive" size="sm">アカウントを削除</Button>
        </CardContent>
      </Card>
    </div>
  );
}
