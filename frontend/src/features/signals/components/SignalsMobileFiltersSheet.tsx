"use client";

import { Dialog } from "@base-ui/react/dialog";
import { SignalsFiltersContent } from "./SignalsFilters";
import { SignalsInfoContent } from "./SignalsInfoContent";
import type { Signal } from "../types";

interface SignalsMobileFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalCount: number;
  filteredCount: number;
  isAdmin: boolean;
  adminQuickMode: boolean;
  onAdminQuickModeChange: (value: boolean) => void;
  dataset?: Signal[];
}

export function SignalsMobileFiltersSheet({
  open,
  onOpenChange,
  totalCount,
  filteredCount,
  isAdmin,
  adminQuickMode,
  onAdminQuickModeChange,
  dataset,
}: SignalsMobileFiltersSheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[1090] bg-black/40 backdrop-blur-[2px] transition-opacity data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <Dialog.Popup className="fixed inset-x-0 bottom-0 z-[1091] outline-none">
          <div className="max-h-[85vh] overflow-y-auto rounded-t-[var(--radius-xl)] bg-white p-4 shadow-[var(--shadow-lg)] transition-all data-[starting-style]:translate-y-full data-[ending-style]:translate-y-full pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="mb-3 flex items-center justify-between">
              <Dialog.Title className="text-base font-semibold text-[color:var(--color-text-heading)]">
                Филтри
              </Dialog.Title>
              <Dialog.Close
                aria-label="Затвори"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-muted)]"
              >
                <i className="bi bi-x-lg" />
              </Dialog.Close>
            </div>
            <SignalsFiltersContent
              stacked
              totalCount={totalCount}
              filteredCount={filteredCount}
              isAdmin={isAdmin}
              adminQuickMode={adminQuickMode}
              onAdminQuickModeChange={onAdminQuickModeChange}
              dataset={dataset}
              showCategoryChips
            />
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

interface SignalsMobileInfoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignalsMobileInfoSheet({ open, onOpenChange }: SignalsMobileInfoSheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[1090] bg-black/40 backdrop-blur-[2px] transition-opacity data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <Dialog.Popup className="fixed inset-x-0 bottom-0 z-[1091] outline-none">
          <div className="max-h-[85vh] overflow-y-auto rounded-t-[var(--radius-xl)] bg-white p-4 shadow-[var(--shadow-lg)] transition-all data-[starting-style]:translate-y-full data-[ending-style]:translate-y-full pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="mb-3 flex items-center justify-between">
              <Dialog.Title className="text-base font-semibold text-[color:var(--color-text-heading)]">
                Как работят сигналите?
              </Dialog.Title>
              <Dialog.Close
                aria-label="Затвори"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-muted)]"
              >
                <i className="bi bi-x-lg" />
              </Dialog.Close>
            </div>
            <SignalsInfoContent />
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
