"use client";

import type { ReactNode } from "react";
import { Navbar } from "@/features/shell";
import { BanBanner } from "@/features/moderation/components/BanBanner";
import type { Language } from "@/lib/i18n/locales";

/** App-layer composition: shell Navbar (+ notification slot). */
export function ShellNavbar({
  notificationSlot,
  lang,
}: {
  notificationSlot?: ReactNode;
  lang: Language;
}) {
  return (
    <>
      <Navbar notificationSlot={notificationSlot} lang={lang} />
      <div className="fixed inset-x-0 top-[var(--navbar-height)] z-[1025]">
        <BanBanner />
      </div>
    </>
  );
}
