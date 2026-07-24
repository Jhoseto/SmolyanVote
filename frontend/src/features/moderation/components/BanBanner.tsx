"use client";

import { useEffect } from "react";
import { useAuth } from "@/shared/lib/authContext";

function formatBanEnd(iso: string): string {
  try {
    return new Date(iso).toLocaleString("bg-BG", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/** Thin banner under the navbar for temporarily restricted accounts. */
export function BanBanner() {
  const { user, isAuthenticated } = useAuth();
  const visible = isAuthenticated && user?.readOnly && user.status !== "PERMANENTLY_BANNED";

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--navbar-offset",
      visible ? "calc(var(--navbar-height) + 2.25rem)" : "var(--navbar-height)",
    );
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="border-b border-amber-300/60 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 px-4 py-2 text-center text-xs text-amber-950 sm:text-sm"
    >
      <i className="bi bi-shield-exclamation mr-1.5 text-amber-600" aria-hidden />
      <strong>Профилът е временно ограничен</strong>
      {user.banEndDate ? (
        <> · може само да разглеждате до {formatBanEnd(user.banEndDate)}</>
      ) : (
        <> · може само да разглеждате съдържание</>
      )}
      {user.banReason ? <> · {user.banReason}</> : null}
    </div>
  );
}
