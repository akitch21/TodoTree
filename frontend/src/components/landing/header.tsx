import { useState } from "react";
import { GitBranch } from "lucide-react";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">

        {/* Logo */}
        <a href="/" className="flex items-center gap-1.5 text-lg font-bold tracking-tight text-foreground">
          <GitBranch size={18} className="text-primary" />
          <span>ToDoTree</span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 text-sm md:flex">
          <a href="#preview" className="text-muted-foreground transition-colors hover:text-foreground">
            プレビュー
          </a>
          <a href="#features" className="text-muted-foreground transition-colors hover:text-foreground">
            特徴
          </a>
          <a href="#structure" className="text-muted-foreground transition-colors hover:text-foreground">
            仕組み
          </a>
          <a href="#team" className="text-muted-foreground transition-colors hover:text-foreground">
            チーム活用
          </a>
        </nav>

        {/* Right */}
        <div className="hidden items-center gap-4 md:flex">
          <a
            href="/login"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ログイン
          </a>

          <a
            href="/signup"
            className="lp-cta-glow rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            無料で始める
          </a>
        </div>

        {/* Mobile Button */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="メニュー"
        >
          ☰
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="space-y-4 border-t bg-background px-6 pb-4 md:hidden">
          <a href="#preview"   className="block text-foreground/80">プレビュー</a>
          <a href="#features"  className="block text-foreground/80">特徴</a>
          <a href="#structure" className="block text-foreground/80">仕組み</a>
          <a href="#team"      className="block text-foreground/80">チーム活用</a>
          <a href="/login"     className="block text-foreground/80">ログイン</a>
          <a
            href="/signup"
            className="block rounded-lg bg-primary py-2 text-center font-semibold text-primary-foreground"
          >
            無料で始める
          </a>
        </div>
      )}
    </header>
  );
}
