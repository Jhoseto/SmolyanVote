"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/shared/lib/authContext";
import { Avatar } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";

interface UserMenuProps {
  className?: string;
  logoutLabel: string;
  layout?: "dropdown" | "drawer";
  drawerPart?: "combined" | "trigger" | "panel";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onNavigate?: () => void;
}

export function UserMenuPanel({
  logoutLabel,
  onNavigate,
}: {
  logoutLabel: string;
  onNavigate?: () => void;
}) {
  const { user, logout } = useAuth();
  if (!user) return null;

  function closeAndNavigate() {
    onNavigate?.();
  }

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-2 text-sm text-[color:var(--color-text-primary)]">
        <i className="bi bi-person shrink-0 text-[1rem]" />
        <span className="min-w-0 font-light tracking-wide break-words">{user.username}</span>
      </div>
      <div className="my-1 border-t border-border-default/60" />
      <Link
        href="/profile"
        onClick={closeAndNavigate}
        className="flex w-full items-center gap-3 px-4 py-2 text-left text-[0.875rem] font-light tracking-wide text-[color:var(--color-text-primary)] transition-colors hover:bg-primary-50 hover:text-primary"
      >
        <i className="bi bi-person-circle text-[1rem]" />
        <span>Моят профил</span>
      </Link>
      {user.role === "ADMIN" && (
        <Link
          href="/admin"
          onClick={closeAndNavigate}
          className="flex w-full items-center gap-3 px-4 py-2 text-left text-[0.875rem] font-light tracking-wide text-[color:var(--color-text-primary)] transition-colors hover:bg-primary-50 hover:text-primary"
        >
          <i className="bi bi-shield-lock text-[1rem]" />
          <span>Админ панел</span>
        </Link>
      )}
      <div className="my-1 border-t border-border-default/60" />
      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          logout();
        }}
        className="flex w-full items-center gap-3 px-4 py-2 text-left text-[0.875rem] font-light tracking-wide text-[color:var(--color-text-primary)] transition-colors hover:bg-primary-50 hover:text-primary"
      >
        <i className="bi bi-box-arrow-right text-[1rem]" />
        <span>{logoutLabel}</span>
      </button>
    </>
  );
}

/** Авторизирано desktop/mobile меню — заменя Вход/Регистрация линковете. */
export function UserMenu({
  className,
  logoutLabel,
  layout = "dropdown",
  drawerPart = "combined",
  open: controlledOpen,
  onOpenChange,
  onNavigate,
}: UserMenuProps) {
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (layout !== "dropdown") return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, [layout, setOpen]);

  if (!user) return null;

  if (layout === "drawer" && drawerPart === "panel") {
    return <UserMenuPanel logoutLabel={logoutLabel} onNavigate={onNavigate} />;
  }

  const panelContent = <UserMenuPanel logoutLabel={logoutLabel} onNavigate={onNavigate} />;

  return (
    <div ref={ref} className={cn(layout === "dropdown" && "relative", className)}>
      {(layout === "dropdown" || drawerPart !== "panel") && (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className={cn(
            "flex items-center gap-2 rounded-full px-2 py-1.5 font-sans text-[0.875rem] font-light tracking-wide text-[color:var(--color-text-nav)] transition-all duration-200 hover:bg-black/[0.035] hover:text-primary",
            layout === "drawer" && "min-h-[44px] w-full justify-start rounded-[12px] px-3 py-2.5",
            layout === "drawer" && open && "bg-primary-50 text-primary",
          )}
        >
          <Avatar username={user.username} imageUrl={user.imageUrl} size={32} />
          <span
            className={cn(
              "max-w-[13rem] truncate",
              layout === "dropdown" && "hidden lg:inline",
            )}
            title={user.username}
          >
            {user.username}
          </span>
          <i
            className={cn(
              "bi bi-chevron-down text-xs transition-transform",
              open && "rotate-180",
              layout === "drawer" && "ml-auto",
            )}
          />
        </button>
      )}

      {layout === "drawer" && drawerPart === "combined" && open ? (
        <div className="mt-1 overflow-hidden rounded-[var(--radius-md)] border border-border-default/60 bg-white py-2 shadow-sm">
          {panelContent}
        </div>
      ) : null}

      {layout === "dropdown" && open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[240px] overflow-hidden rounded-[var(--radius-md)] border border-border-default/60 bg-white/95 py-2 shadow-[var(--shadow-dropdown)] backdrop-blur-md">
          {panelContent}
        </div>
      )}
    </div>
  );
}
