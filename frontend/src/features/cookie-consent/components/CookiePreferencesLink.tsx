"use client";

import { useConsentStore } from "../lib/consentStore";

/** Persistent "manage cookies" trigger — composed into `Footer` via slot (app layer). */
export function CookiePreferencesLink({ className }: { className?: string }) {
  const openManage = useConsentStore((s) => s.openManage);

  return (
    <button type="button" onClick={openManage} className={className}>
      Управление на бисквитките
    </button>
  );
}
