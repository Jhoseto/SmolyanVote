"use client";

import { useEffect, useState } from "react";

/**
 * Reactive desktop gate for the messenger shell (>768px).
 * Reads matchMedia synchronously on the client so the first paint after
 * hydration is correct — avoiding a flash where FAB opens DownloadModal.
 */
export function useIsDesktopMessenger(): boolean {
  const [desktop, setDesktop] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(min-width: 769px)").matches;
  });

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 769px)");
    const sync = () => setDesktop(mql.matches);
    sync();
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, []);

  return desktop;
}
