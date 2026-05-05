import { createContext, useContext, useEffect, useState } from "react";

// ── Types ──────────────────────────────────────────────────────
export type Theme = "default" | "light" | "dark";

export interface ThemeOption {
  id:    Theme;
  label: string;
  desc:  string;
  // Preview swatch colors [bg, primary, accent]
  swatches: [string, string, string];
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id:       "default",
    label:    "デフォルト",
    desc:     "温かみのある樹木・大地の色調",
    swatches: ["#f7f3ed", "#3d6b3f", "#8b6344"],
  },
  {
    id:       "light",
    label:    "ライト",
    desc:     "明るい森の朝をイメージした清涼感",
    swatches: ["#f0f8f0", "#2e7d52", "#5a9e6f"],
  },
  {
    id:       "dark",
    label:    "ダーク",
    desc:     "深い森の夜をイメージした落ち着き",
    swatches: ["#1a2318", "#5aad5a", "#2d4a2f"],
  },
];

// CSS class applied to <html> for each theme
const THEME_CLASSES: Record<Theme, string> = {
  default: "theme-nature-default",
  light:   "theme-nature-light",
  dark:    "theme-nature-dark",
};

const STORAGE_KEY = "todotree-theme";

// ── Context ────────────────────────────────────────────────────
interface ThemeContextType {
  theme:    Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme:    "default",
  setTheme: () => {},
});

// ── Provider ───────────────────────────────────────────────────
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, _setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    return stored ?? "default";
  });

  function applyTheme(t: Theme) {
    const root = document.documentElement;
    // Remove all theme classes first
    Object.values(THEME_CLASSES).forEach((cls) => root.classList.remove(cls));
    // Apply the new one
    root.classList.add(THEME_CLASSES[t]);
  }

  // Apply on mount and whenever theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function setTheme(t: Theme) {
    localStorage.setItem(STORAGE_KEY, t);
    _setTheme(t);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────
export function useTheme(): ThemeContextType {
  return useContext(ThemeContext);
}
