import { createContext, useContext, useState, type ReactNode } from "react";
import { api } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  created_at: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

// ── Context ────────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthState | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────────

function loadToken() {
  return localStorage.getItem("todotree-token");
}

function loadUser(): AuthUser | null {
  const raw = localStorage.getItem("todotree-user");
  if (!raw) return null;
  try { return JSON.parse(raw) as AuthUser; } catch { return null; }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken]   = useState<string | null>(loadToken);
  const [user,  setUser]    = useState<AuthUser | null>(loadUser);

  function persist(newToken: string, newUser: AuthUser) {
    localStorage.setItem("todotree-token", newToken);
    localStorage.setItem("todotree-user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }

  async function login(email: string, password: string) {
    const { data } = await api.post<{ access_token: string; user: AuthUser }>(
      "/api/auth/login",
      { email, password }
    );
    persist(data.access_token, data.user);
  }

  async function register(name: string, email: string, password: string) {
    const { data } = await api.post<{ access_token: string; user: AuthUser }>(
      "/api/auth/register",
      { name, email, password }
    );
    persist(data.access_token, data.user);
  }

  function logout() {
    localStorage.removeItem("todotree-token");
    localStorage.removeItem("todotree-user");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated: !!token, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
