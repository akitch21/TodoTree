import { useState } from "react";
import { UserPlus, Trash2, Crown, User } from "lucide-react";
import type { User as UserType } from "@/types";

// ── Mock user search pool ────────────────────────────────────────────────────
const ALL_USERS: UserType[] = [
  { id: "u1", name: "Alice Tanaka",   email: "alice@example.com"  },
  { id: "u2", name: "Bob Suzuki",     email: "bob@example.com"    },
  { id: "u3", name: "Carol Yamada",   email: "carol@example.com"  },
  { id: "u4", name: "David Kim",      email: "david@example.com"  },
  { id: "u5", name: "Eve Nakamura",   email: "eve@example.com"    },
  { id: "u6", name: "Frank Ito",      email: "frank@example.com"  },
];

export type MemberRole = "owner" | "member";

export interface ProjectMember {
  user: UserType;
  role: MemberRole;
}

interface Props {
  members: ProjectMember[];
  onChange: (members: ProjectMember[]) => void;
}

export default function MemberEditor({ members, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const memberIds = new Set(members.map((m) => m.user.id));

  const suggestions = query.trim()
    ? ALL_USERS.filter(
        (u) =>
          !memberIds.has(u.id) &&
          (u.name.toLowerCase().includes(query.toLowerCase()) ||
            u.email.toLowerCase().includes(query.toLowerCase()))
      )
    : [];

  const addMember = (user: UserType) => {
    onChange([...members, { user, role: "member" }]);
    setQuery("");
    setShowDropdown(false);
  };

  const removeMember = (userId: string) => {
    onChange(members.filter((m) => m.user.id !== userId));
  };

  const toggleRole = (userId: string) => {
    onChange(
      members.map((m) =>
        m.user.id === userId
          ? { ...m, role: m.role === "owner" ? "member" : "owner" }
          : m
      )
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Add member search */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">メンバーを追加</label>
        <div className="relative">
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              placeholder="名前またはメールアドレスで検索..."
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
            />
            <button
              disabled={!query.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              <UserPlus size={14} />
              追加
            </button>
          </div>

          {/* Dropdown suggestions */}
          {showDropdown && suggestions.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full rounded-lg border bg-popover shadow-md">
              {suggestions.map((u) => (
                <li key={u.id}>
                  <button
                    onMouseDown={() => addMember(u)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-sm hover:bg-accent text-left"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Member list */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">
            現在のメンバー ({members.length}人)
          </label>
          <span className="text-xs text-muted-foreground">
            王冠アイコンをクリックしてオーナー権限を切り替え
          </span>
        </div>

        {members.length === 0 ? (
          <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
            メンバーがいません
          </div>
        ) : (
          <ul className="divide-y rounded-lg border overflow-hidden">
            {members.map(({ user, role }) => (
              <li key={user.id} className="flex items-center gap-3 bg-card px-4 py-3">
                {/* Avatar */}
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold shrink-0">
                  {user.name.charAt(0)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>

                {/* Role badge */}
                <span
                  className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                    role === "owner"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {role === "owner" ? "オーナー" : "メンバー"}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    title={role === "owner" ? "メンバーに変更" : "オーナーに変更"}
                    onClick={() => toggleRole(user.id)}
                    className="rounded p-1.5 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {role === "owner" ? <Crown size={14} className="text-amber-500" /> : <User size={14} />}
                  </button>
                  <button
                    title="削除"
                    onClick={() => removeMember(user.id)}
                    className="rounded p-1.5 hover:bg-accent text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
