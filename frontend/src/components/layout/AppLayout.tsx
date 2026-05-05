import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  CheckSquare,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Users,
  X,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { useAuth } from "@/store/AuthContext";

const navItems = [
  { to: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { to: "/projects",  label: "プロジェクト",   icon: FolderOpen },
  { to: "/tasks",     label: "タスク（個人）",  icon: CheckSquare },
  { to: "/team",      label: "チームスペース",  icon: Users },
];

const bottomItems = [
  { to: "/settings", label: "設定", icon: Settings },
];

export default function AppLayout() {
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [searchOpen,   setSearchOpen]   = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => { logout(); navigate("/login"); };

  // ⌘K / Ctrl+K shortcut
  const openSearch  = useCallback(() => setSearchOpen(true),  []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const NavList = ({ onClickItem }: { onClickItem?: () => void }) => (
    <ul className="space-y-0.5">
      {navItems.map(({ to, label, icon: Icon }) => (
        <li key={to}>
          <NavLink
            to={to}
            onClick={onClickItem}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden w-60 flex-col border-r bg-card md:flex">
        <div className="flex h-16 items-center border-b px-5">
          <Link to="/" className="text-lg font-bold tracking-tight">
            ToDoTree
          </Link>
        </div>

        {/* Search button */}
        <div className="px-3 pt-3 pb-1">
          <button
            onClick={openSearch}
            className="flex w-full items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
          >
            <Search size={14} />
            <span className="flex-1 text-left text-xs">検索...</span>
            <kbd className="rounded border bg-background px-1 py-0.5 text-[10px] font-mono">⌘K</kbd>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <NavList />
        </nav>

        <Separator />

        <div className="px-3 py-3">
          {bottomItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="mt-0.5 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <LogOut size={16} />
            ログアウト
          </button>
        </div>
      </aside>

      {/* ── Mobile Overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Mobile Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r bg-card transition-transform duration-200 md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b px-5">
          <Link to="/" className="text-lg font-bold tracking-tight">
            ToDoTree
          </Link>
          <button onClick={() => setSidebarOpen(false)}>
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <NavList onClickItem={() => setSidebarOpen(false)} />
        </nav>

        <Separator />

        <div className="px-3 py-3">
          {bottomItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="mt-0.5 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <LogOut size={16} />
            ログアウト
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center gap-3 border-b px-4 md:hidden">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu size={20} className="text-muted-foreground" />
          </button>
          <span className="flex-1 text-lg font-bold tracking-tight">ToDoTree</span>
          <button
            onClick={openSearch}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <Search size={18} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      {/* ── Global search modal ── */}
      <GlobalSearch open={searchOpen} onClose={closeSearch} />
    </div>
  );
}
