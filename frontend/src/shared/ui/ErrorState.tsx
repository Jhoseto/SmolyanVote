import { cn } from "@/shared/lib/cn";
import { Button } from "./Button";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Explicit error surface for failed queries — no silent fallbacks
 * (V1 anti-pattern: `filterPostsLocally()` swallowing errors and
 * returning `true`). Always shown instead of a blank/empty list.
 */
export function ErrorState({
  title = "Нещо се обърка",
  description = "Съдържанието не можа да се зареди. Моля, опитайте отново.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3 px-6 py-16 text-center", className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--color-error)]/10">
        <i className="bi bi-exclamation-triangle text-[1.75rem] text-[color:var(--color-error)]" />
      </div>
      <h3 className="text-base font-semibold text-[color:var(--color-text-heading)]">{title}</h3>
      <p className="max-w-[380px] text-sm text-[color:var(--color-text-secondary)]">{description}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
          <i className="bi bi-arrow-clockwise" />
          Опитай отново
        </Button>
      )}
    </div>
  );
}
