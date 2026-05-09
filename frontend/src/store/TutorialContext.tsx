import { createContext, useContext, useState, type ReactNode } from "react";

// ── Storage key ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = "todotree-onboarding";

// ── Step definitions ─────────────────────────────────────────────────────────────

export interface TutorialStep {
  emoji:       string;
  title:       string;
  description: string;
  /** Optional link shown as an action button inside the step */
  actionLabel?: string;
  actionPath?:  string;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    emoji:       "🌳",
    title:       "ToDoTree へようこそ！",
    description:
      "このチュートリアルでは、プロジェクトの作成からタスク管理まで基本的な使い方をご案内します。各ステップはいつでもスキップできます。",
  },
  {
    emoji:       "📁",
    title:       "プロジェクトを作成する",
    description:
      "左サイドバーの「プロジェクト」から新しいプロジェクトを作成しましょう。プロジェクトはタスクをまとめる単位です。「＋ 新規プロジェクト」ボタンを押してみてください。",
    actionLabel: "プロジェクトページへ",
    actionPath:  "/projects",
  },
  {
    emoji:       "✅",
    title:       "タスクを追加する",
    description:
      "プロジェクト詳細ページでタスクを追加できます。タスクには期限・担当者・サブタスクを設定でき、ツリー構造で整理することもできます。",
  },
  {
    emoji:       "📋",
    title:       "カンバンでステータスを管理する",
    description:
      "タスクは「待機中 → 進行中 → 完了」の 3 ステータスで管理します。カンバンビューではカードをドラッグ＆ドロップでステータスを変更できます。",
  },
  {
    emoji:       "👥",
    title:       "チームメンバーを招待する",
    description:
      "プロジェクト設定からメンバーをメールアドレスで招待できます。招待されたメンバーは同じプロジェクトのタスクを共同で管理できます。",
  },
];

// ── Context type ──────────────────────────────────────────────────────────────

interface TutorialState {
  isOpen:      boolean;
  currentStep: number;
  totalSteps:  number;
  step:        TutorialStep;
  next:        () => void;
  skipStep:    () => void;
  skipAll:     () => void;
}

const TutorialContext = createContext<TutorialState | null>(null);

// ── Provider ────────────────────────────────────────────────────────────────────

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(
    () => localStorage.getItem(STORAGE_KEY) === "pending",
  );
  const [currentStep, setCurrentStep] = useState(0);

  function advance() {
    if (currentStep >= TUTORIAL_STEPS.length - 1) {
      finish();
    } else {
      setCurrentStep((s) => s + 1);
    }
  }

  function finish() {
    localStorage.setItem(STORAGE_KEY, "done");
    setIsOpen(false);
  }

  return (
    <TutorialContext.Provider
      value={{
        isOpen,
        currentStep,
        totalSteps: TUTORIAL_STEPS.length,
        step:       TUTORIAL_STEPS[currentStep],
        next:       advance,
        skipStep:   advance,   // same behaviour — advance to next or close
        skipAll:    finish,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useTutorial(): TutorialState {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error("useTutorial must be used within TutorialProvider");
  return ctx;
}
