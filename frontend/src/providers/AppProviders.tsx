"use client";

import type { ReactNode } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { QueryProvider } from "./QueryProvider";
import { AuthProvider } from "./AuthProvider";
import { GoogleTranslateProvider } from "@/lib/i18n-web-translate";
import { Toaster, ConfirmDialogHost, BackToTop, HeartbeatBeacon } from "@/shared/ui";
import { CookieConsentRoot } from "@/features/cookie-consent";
import { LoginGateModal } from "@/features/auth";
import { PodcastMiniPlayer } from "@/features/podcast";
import { MessengerRoot } from "@/features/messenger";

/** Single wiring point for all client-side providers (keeps layout.tsx thin). */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <NuqsAdapter>
      <QueryProvider>
        <AuthProvider>
          {children}
          <GoogleTranslateProvider />
          <Toaster />
          <ConfirmDialogHost />
          <LoginGateModal />
          <CookieConsentRoot />
          <BackToTop />
          <HeartbeatBeacon />
          <PodcastMiniPlayer />
          <MessengerRoot />
        </AuthProvider>
      </QueryProvider>
    </NuqsAdapter>
  );
}
