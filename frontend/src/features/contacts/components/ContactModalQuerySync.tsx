"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useContactModalStore } from "@/shared/lib/contactModalStore";

/**
 * Watches for `?contact=1` and opens the contact modal store flag. Kept as
 * its own tiny always-mounted component (separate from `ContactModal`) so
 * the deep-link works instantly without eagerly loading the modal/form
 * bundle for the ~99% of visits that never use it.
 */
export function ContactModalQuerySync() {
  const searchParams = useSearchParams();
  const open = useContactModalStore((s) => s.open);

  useEffect(() => {
    if (searchParams.get("contact") !== "1") return;
    open();
    const url = new URL(window.location.href);
    url.searchParams.delete("contact");
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState({}, "", next || "/");
  }, [searchParams, open]);

  return null;
}
