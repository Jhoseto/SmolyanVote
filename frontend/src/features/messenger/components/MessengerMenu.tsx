"use client";

import type { ReactNode } from "react";
import { ContextMenu } from "@base-ui/react/context-menu";
import { cn } from "@/shared/lib/cn";

const POPUP_CLASS = cn(
  "sv-msg-surface relative min-w-[190px] origin-[var(--transform-origin)] overflow-hidden p-1 outline-hidden",
  "transition-[scale,opacity] duration-100 ease-out",
  "data-ending-style:scale-[0.98] data-ending-style:opacity-0",
  "data-starting-style:scale-[0.98] data-starting-style:opacity-0",
);

const ITEM_CLASS = cn(
  "flex cursor-default select-none items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-1.5",
  "text-[13px] text-[color:var(--color-text-primary)] outline-hidden",
  "data-highlighted:bg-[color:var(--color-primary-50)] data-highlighted:text-[color:var(--color-primary)]",
  "data-disabled:opacity-50",
);

export interface MenuAction {
  id: string;
  label: string;
  icon: string;
  danger?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

interface MessengerContextMenuProps {
  actions: MenuAction[];
  children: ReactNode;
  /** `render` target for the trigger, so it doesn't add an extra wrapper. */
  className?: string;
}

/** Right-click menu shared by conversation rows and message bubbles. */
export function MessengerContextMenu({ actions, children, className }: MessengerContextMenuProps) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger className={className}>{children}</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner className="z-[1200] outline-hidden">
          <ContextMenu.Popup className={POPUP_CLASS} data-glass="on">
            {actions.map((action) => (
              <ContextMenu.Item
                key={action.id}
                disabled={action.disabled}
                onClick={action.onSelect}
                className={cn(
                  ITEM_CLASS,
                  action.danger &&
                    "text-[color:var(--color-error)] data-highlighted:bg-[color:var(--color-error)]/10 data-highlighted:text-[color:var(--color-error)]",
                )}
              >
                <i className={cn("bi", action.icon, "text-[13px] opacity-70")} />
                {action.label}
              </ContextMenu.Item>
            ))}
          </ContextMenu.Popup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
