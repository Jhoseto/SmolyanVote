"use client";

import { cn } from "@/shared/lib/cn";
import { useAuth } from "@/shared/lib/authContext";
import { useRequireAuth } from "@/shared/hooks/useRequireAuth";
import { useSignalsFilters } from "../hooks/useSignalsFilters";

interface QuickChipProps {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  icon: string;
  label: string;
}

function QuickChip({ active, onClick, disabled, icon, label }: QuickChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-[var(--radius-pill)] px-2.5 py-1.5 text-[0.68rem] font-semibold transition-all disabled:opacity-50",
        active
          ? "bg-[image:var(--gradient-primary)] text-white shadow-[0_2px_8px_rgba(25,134,28,0.3)]"
          : "border border-border-default/35 bg-white text-[color:var(--color-text-secondary)]",
      )}
    >
      <i className={cn("bi text-[0.72rem]", icon)} />
      {label}
    </button>
  );
}

interface SignalsMobileQuickFiltersProps {
  isAdmin?: boolean;
  adminQuickMode?: boolean;
  onAdminQuickModeChange?: (value: boolean) => void;
  onOpenAdvanced?: () => void;
  className?: string;
}

/** One-tap toggles for the most-used desktop filter chips. */
export function SignalsMobileQuickFilters({
  isAdmin,
  adminQuickMode,
  onAdminQuickModeChange,
  onOpenAdvanced,
  className,
}: SignalsMobileQuickFiltersProps) {
  const [filters, setFilters] = useSignalsFilters();
  const { user } = useAuth();
  const requireAuth = useRequireAuth();

  async function toggleMineOnly() {
    if (!filters.mineOnly && !(await requireAuth("да видиш само твоите сигнали"))) return;
    setFilters({ mineOnly: !filters.mineOnly });
  }

  return (
    <div className={cn("signals-mobile-quick-filters shrink-0 border-b border-border-default/10 bg-white/90", className)}>
      <div className="flex items-center gap-2 overflow-x-auto px-3 py-2 scrollbar-none">
        {onOpenAdvanced ? (
          <button
            type="button"
            onClick={onOpenAdvanced}
            className="inline-flex shrink-0 items-center gap-1 rounded-[var(--radius-pill)] border border-primary/30 bg-primary-50 px-2.5 py-1.5 text-[0.68rem] font-semibold text-primary"
          >
            <i className="bi bi-sliders" />
            Още
          </button>
        ) : null}
        <QuickChip
          active={filters.nearMe}
          onClick={() => setFilters({ nearMe: !filters.nearMe })}
          icon="bi-geo"
          label="Близо до мен"
        />
        <QuickChip
          active={filters.highPriorityOnly}
          onClick={() => setFilters({ highPriorityOnly: !filters.highPriorityOnly })}
          icon="bi-exclamation-circle"
          label="Висок приоритет"
        />
        <QuickChip
          active={filters.mineOnly}
          onClick={toggleMineOnly}
          disabled={!user && !filters.mineOnly}
          icon="bi-person"
          label="Моите"
        />
        <QuickChip
          active={filters.boostedOnly}
          onClick={() => setFilters({ boostedOnly: !filters.boostedOnly })}
          icon="bi-arrow-up-circle"
          label="Вдигнати"
        />
        <QuickChip
          active={filters.resolvedOnly}
          onClick={() => setFilters({ resolvedOnly: !filters.resolvedOnly, showInactive: false })}
          icon="bi-check-circle"
          label="Решени"
        />
        <QuickChip
          active={filters.showInactive}
          onClick={() => setFilters({ showInactive: !filters.showInactive })}
          icon="bi-eye-slash"
          label="Неактивни"
        />
        {isAdmin ? (
          <QuickChip
            active={!!adminQuickMode}
            onClick={() => onAdminQuickModeChange?.(!adminQuickMode)}
            icon="bi-shield-check"
            label="Модерация"
          />
        ) : null}
      </div>
    </div>
  );
}
