import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTutorial } from "@/store/TutorialContext";

export function TutorialModal() {
  const { isOpen, currentStep, totalSteps, step, next, skipStep, skipAll } =
    useTutorial();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const isLast = currentStep === totalSteps - 1;

  function handleAction() {
    if (step.actionPath) navigate(step.actionPath);
    next();
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && skipAll()}
    >
      {/* Modal card */}
      <div className="relative w-full max-w-md rounded-2xl border bg-card shadow-2xl">

        {/* Top-right: skip-all link + close button */}
        <div className="flex items-center justify-between px-5 pt-4">
          <button
            onClick={skipAll}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            チュートリアルをスキップ
          </button>
          <button
            onClick={skipAll}
            aria-label="閉じる"
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col items-center gap-4 px-8 pb-6 pt-4 text-center">

          {/* Emoji icon */}
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-4xl">
            {step.emoji}
          </div>

          {/* Title */}
          <h2 className="text-lg font-bold tracking-tight">{step.title}</h2>

          {/* Description */}
          <p className="text-sm leading-relaxed text-muted-foreground">
            {step.description}
          </p>

          {/* Optional action button */}
          {step.actionLabel && step.actionPath && (
            <button
              onClick={handleAction}
              className="rounded-lg border border-primary/40 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              {step.actionLabel} →
            </button>
          )}
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 pb-4">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "block h-1.5 rounded-full transition-all duration-300",
                i === currentStep
                  ? "w-5 bg-primary"
                  : "w-1.5 bg-muted-foreground/30",
              )}
            />
          ))}
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-between border-t px-6 py-4">
          {/* Skip this step */}
          {!isLast ? (
            <button
              onClick={skipStep}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              このステップをスキップ
            </button>
          ) : (
            <span />
          )}

          {/* Primary: 次へ / 完了 */}
          <button
            onClick={next}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {isLast ? "完了" : "次へ →"}
          </button>
        </div>
      </div>
    </div>
  );
}
