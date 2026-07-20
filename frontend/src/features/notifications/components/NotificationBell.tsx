"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/shared/lib/authContext";
import { cn } from "@/shared/lib/cn";
import { useUnreadCount } from "../hooks/useUnreadCount";
import { useNotificationRealtime } from "../hooks/useNotificationRealtime";
import { NotificationDropdown } from "./NotificationDropdown";

/** Navbar bell + unread badge + dropdown. Renders nothing for anonymous users. */
export function NotificationBell() {
  const { isAuthenticated, isHydrated } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useNotificationRealtime();
  const { data } = useUnreadCount();

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, []);

  if (!isHydrated || !isAuthenticated) return null;

  const count = data?.count ?? 0;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Известия"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-[color:var(--color-text-nav)] transition-colors hover:bg-primary-50 hover:text-primary"
      >
        <i className="bi bi-bell text-[1.15rem]" />
        {count > 0 && (
          <span
            className={cn(
              "absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[color:var(--color-error)] px-1 text-[0.62rem] font-bold leading-none text-white",
            )}
          >
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && <NotificationDropdown onClose={() => setOpen(false)} />}
    </div>
  );
}
