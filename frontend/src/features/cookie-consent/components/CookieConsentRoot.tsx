"use client";

import { useEffect } from "react";
import { useConsentStore } from "../lib/consentStore";
import { CookieConsentBanner } from "./CookieConsentBanner";
import { CookieConsentManageModal } from "./CookieConsentManageModal";

/** Single mount point — wired once in `AppProviders`. */
export function CookieConsentRoot() {
  const hydrate = useConsentStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <>
      <CookieConsentBanner />
      <CookieConsentManageModal />
    </>
  );
}
