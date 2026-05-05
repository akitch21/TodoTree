import { GitBranch } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-6 py-12 grid gap-8 sm:grid-cols-2 md:grid-cols-4 text-sm text-muted-foreground">

        {/* Brand */}
        <div className="sm:col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <GitBranch size={16} className="text-primary" /> ToDoTree
          </div>
          <p className="mt-3 leading-6">
            タスクの親子関係を可視化し、<br />チームの作業を整理するツール。
          </p>
        </div>

        {/* Product */}
        <div>
          <h3 className="font-semibold text-foreground mb-3">プロダクト</h3>
          <ul className="space-y-2">
            <li><a href="#features"  className="hover:text-foreground transition-colors">機能</a></li>
            <li><a href="#structure" className="hover:text-foreground transition-colors">仕組み</a></li>
            <li><a href="#team"      className="hover:text-foreground transition-colors">チーム活用</a></li>
          </ul>
        </div>

        {/* Account */}
        <div>
          <h3 className="font-semibold text-foreground mb-3">アカウント</h3>
          <ul className="space-y-2">
            <li><a href="/login"  className="hover:text-foreground transition-colors">ログイン</a></li>
            <li><a href="/signup" className="hover:text-foreground transition-colors">新規登録</a></li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h3 className="font-semibold text-foreground mb-3">法的情報</h3>
          <ul className="space-y-2">
            <li><a href="/privacy" className="hover:text-foreground transition-colors">プライバシーポリシー</a></li>
            <li><a href="/terms"   className="hover:text-foreground transition-colors">利用規約</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} ToDoTree. All rights reserved.
      </div>
    </footer>
  );
}
