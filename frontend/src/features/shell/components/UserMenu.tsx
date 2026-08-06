"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/shared/lib/authContext";
import { Avatar } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useMyProfileStats } from "@/shared/hooks/useMyProfileStats";
import { useMessengerUiStore } from "@/features/messenger/store/messengerUiStore";
import { useIsDesktopMessenger } from "@/features/messenger/lib/isDesktopMessenger";
import { UserMenuGamificationHeader, UserMenuGamificationSkeleton } from "./UserMenuGamificationHeader";

interface UserMenuProps {
  className?: string;
  logoutLabel: string;
  layout?: "dropdown" | "drawer";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onNavigate?: () => void;
}

function MenuDivider() {
  return <div className="my-1 border-t border-border-default/60" />;
}

function menuItemClassName() {
  return "flex w-full items-center gap-3 px-4 py-2 text-left text-[0.875rem] font-light tracking-wide text-[color:var(--color-text-primary)] transition-colors hover:bg-primary-50 hover:text-primary";
}

function UserMenuPanel({
  logoutLabel,
  onNavigate,
  menuOpen,
}: {
  logoutLabel: string;
  onNavigate?: () => void;
  menuOpen: boolean;
}) {
  const { user, logout, isAuthenticated } = useAuth();
  const { stats, isPending } = useMyProfileStats(menuOpen);
  const openPanel = useMessengerUiStore((s) => s.openPanel);
  const setDownloadModalOpen = useMessengerUiStore((s) => s.setDownloadModalOpen);
  const isDesktop = useIsDesktopMessenger();

  if (!user) return null;

  function closeAndNavigate() {
    onNavigate?.();
  }

  function openMessenger() {
    closeAndNavigate();
    if (!isAuthenticated || !isDesktop) {
      setDownloadModalOpen(true);
      return;
    }
    openPanel();
  }

  return (
    <>
      {stats ? (
        <>
          <UserMenuGamificationHeader stats={stats} onNavigate={onNavigate} />
          <MenuDivider />
        </>
      ) : isPending && menuOpen ? (
        <UserMenuGamificationSkeleton />
      ) : null}

      <Link href="/profile" onClick={closeAndNavigate} className={menuItemClassName()}>
        <i className="bi bi-person-circle text-[1rem]" />
        <span>Моят профил</span>
      </Link>
      <Link href="/publications/saved" onClick={closeAndNavigate} className={menuItemClassName()}>
        <i className="bi bi-bookmark text-[1rem]" />
        <span>Запазени</span>
      </Link>
      <button type="button" onClick={openMessenger} className={menuItemClassName()}>
        <i className="bi bi-chat-dots text-[1rem]" />
        <span>Съобщения</span>
      </button>

      {user.role === "ADMIN" ? (
        <Link href="/admin" onClick={closeAndNavigate} className={menuItemClassName()}>
          <i className="bi bi-shield-lock text-[1rem]" />
          <span>Админ панел</span>
        </Link>
      ) : null}

      <MenuDivider />

      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          logout();
        }}
        className={menuItemClassName()}
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

  const panelContent = (
    <UserMenuPanel logoutLabel={logoutLabel} onNavigate={onNavigate} menuOpen={open} />
  );

  return (
    <div ref={ref} className={cn(layout === "dropdown" && "relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={cn(
          "flex items-center gap-2 rounded-full border border-black/[0.08] px-2 py-1.5 font-sans text-[0.875rem] font-light tracking-wide text-[color:var(--color-text-nav)] transition-all duration-200 hover:border-black/[0.12] hover:bg-black/[0.035] hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/35",
          layout === "drawer" && "min-h-[44px] w-full justify-start rounded-[12px] border-border-default/60 px-3 py-2.5",
          layout === "drawer" && open && "border-primary/25 bg-primary-50 text-primary",
          layout === "dropdown" && open && "border-primary/20 bg-black/[0.02]",
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

      {layout === "drawer" && open ? (
        <div className="mb-2 mt-1 overflow-hidden rounded-[var(--radius-md)] border border-border-default/60 bg-primary-50/30 py-2 shadow-sm">
          {panelContent}
        </div>
      ) : null}

      {layout === "dropdown" && open && (
        <div className="absolute left-1/2 top-[calc(100%+8px)] z-50 min-w-[240px] -translate-x-1/2 overflow-hidden rounded-[var(--radius-md)] border border-border-default/60 bg-white/98 py-1.5 shadow-[var(--shadow-dropdown)] backdrop-blur-md">
          {panelContent}
        </div>
      )}
    </div>
  );
}
