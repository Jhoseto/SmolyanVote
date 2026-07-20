import { cn } from "@/shared/lib/cn";

interface EventsPaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

/** Windowed page numbers (±2 around current) — mirrors v1 `addPaginationInfo`. */
export function EventsPagination({ page, totalPages, onChange }: EventsPaginationProps) {
  if (totalPages <= 1) return null;

  let start = Math.max(0, page - 2);
  let end = Math.min(totalPages - 1, page + 2);
  if (totalPages <= 5) {
    start = 0;
    end = totalPages - 1;
  }

  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <nav className="flex items-center justify-center gap-1.5" aria-label="Пагинация">
      <button
        type="button"
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-border-default/60 text-[color:var(--color-text-secondary)] transition-colors hover:border-primary/40 hover:text-primary disabled:pointer-events-none disabled:opacity-40"
        aria-label="Предишна страница"
      >
        <i className="bi bi-chevron-left" />
      </button>

      {start > 0 && <span className="px-1 text-[color:var(--color-text-muted)]">…</span>}

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          aria-current={p === page ? "page" : undefined}
          className={cn(
            "inline-flex h-9 min-w-9 items-center justify-center rounded-[var(--radius-md)] px-2 text-sm font-medium transition-colors",
            p === page
              ? "bg-[image:var(--gradient-primary)] text-white shadow-[var(--shadow-sm)]"
              : "border border-border-default/60 text-[color:var(--color-text-secondary)] hover:border-primary/40 hover:text-primary",
          )}
        >
          {p + 1}
        </button>
      ))}

      {end < totalPages - 1 && <span className="px-1 text-[color:var(--color-text-muted)]">…</span>}

      <button
        type="button"
        disabled={page >= totalPages - 1}
        onClick={() => onChange(page + 1)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-border-default/60 text-[color:var(--color-text-secondary)] transition-colors hover:border-primary/40 hover:text-primary disabled:pointer-events-none disabled:opacity-40"
        aria-label="Следваща страница"
      >
        <i className="bi bi-chevron-right" />
      </button>
    </nav>
  );
}
