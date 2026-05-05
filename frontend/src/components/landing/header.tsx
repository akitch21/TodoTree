import { useState } from "react";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 z-50 w-full border-b bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        
        {/* Logo */}
        <a href="/" className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
          ToDoTree
        </a>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 text-sm md:flex">
          <a href="#features" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            特徴
          </a>
          <a href="#structure" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            仕組み
          </a>
          <a href="#team" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            チーム活用
          </a>
        </nav>

        {/* Right */}
        <div className="hidden items-center gap-4 md:flex">
          <a
            href="/login"
            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            ログイン
          </a>

          <a
            href="#cta"
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          >
            無料で始める
          </a>
        </div>

        {/* Mobile Button */}
        <button
          className="md:hidden text-gray-700 dark:text-gray-200"
          onClick={() => setIsOpen(!isOpen)}
        >
          ☰
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="space-y-4 border-t bg-white px-6 pb-4 dark:border-gray-800 dark:bg-gray-950 md:hidden">
          <a href="#features" className="block text-gray-700 dark:text-gray-300">
            特徴
          </a>
          <a href="#structure" className="block text-gray-700 dark:text-gray-300">
            仕組み
          </a>
          <a href="#team" className="block text-gray-700 dark:text-gray-300">
            チーム活用
          </a>
          <a href="/login" className="block text-gray-700 dark:text-gray-300">
            ログイン
          </a>
          <a
            href="#cta"
            className="block rounded-lg bg-gray-900 py-2 text-center text-white dark:bg-white dark:text-gray-900"
          >
            無料で始める
          </a>
        </div>
      )}
    </header>
  );
}