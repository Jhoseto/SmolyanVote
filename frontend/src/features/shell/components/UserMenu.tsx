"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/shared/lib/authContext";
import { Avatar } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";

interface UserMenuProps {
  className?: string;
  logoutLabel: string;
}

/** Авторизирано desktop/mobile меню — заменя Вход/Регистрация линковете. */
export function UserMenu({ className, logoutLabel }: UserMenuProps) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-[var(--radius-pill)] px-2 py-1.5 text-[0.85rem] font-medium text-[color:var(--color-text-nav)] transition-colors hover:text-primary"
      >
        <Avatar username={user.username} imageUrl={user.imageUrl} size={32} />
        <span className="hidden max-w-[120px] truncate lg:inline">{user.username}</span>
        <i className={cn("bi bi-chevron-down text-xs transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[200px] overflow-hidden rounded-[var(--radius-md)] border border-border-default/60 bg-white/95 py-2 shadow-[var(--shadow-dropdown)] backdrop-blur-md">
          <div className="flex items-center gap-3 px-4 py-2 text-sm text-[color:var(--color-text-primary)]">
            <i className="bi bi-person text-[1rem]" />
            <span className="truncate">{user.username}</span>
          </div>
          <div className="my-1 border-t border-border-default/60" />
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-[color:var(--color-text-primary)] transition-colors hover:bg-primary-50"
          >
            <i className="bi bi-person-circle text-[1rem]" />
            <span>Моят профил</span>
          </Link>
          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-[color:var(--color-text-primary)] transition-colors hover:bg-primary-50"
            >
              <i className="bi bi-shield-lock text-[1rem]" />
              <span>Админ панел</span>
            </Link>
          )}
          <div className="my-1 border-t border-border-default/60" />
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-[color:var(--color-text-primary)] transition-colors hover:bg-primary-50"
          >
            <i className="bi bi-box-arrow-right text-[1rem]" />
            <span>{logoutLabel}</span>
          </button>
        </div>
      )}
    </div>
  );
}
