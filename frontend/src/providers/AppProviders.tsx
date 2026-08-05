"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { QueryProvider } from "./QueryProvider";
import { AuthProvider } from "./AuthProvider";
import { useAuth } from "@/shared/lib/authContext";
import { GoogleTranslateProvider } from "@/lib/i18n-web-translate";
import { Toaster, ConfirmDialogHost, BackToTop, HeartbeatBeacon, ModerationWarningHost, PermanentBanModalHost } from "@/shared/ui";
import { CookieConsentRoot } from "@/features/cookie-consent";
import { ContactModal } from "@/features/contacts";
import { LoginGateModal } from "@/features/auth";
import { PodcastMiniPlayer } from "@/features/podcast";
import { useMessengerUiStore } from "@/features/messenger/store/messengerUiStore";

const MessengerRoot = dynamic(
  () => import("@/features/messenger/components/MessengerRoot").then((m) => m.MessengerRoot),
  { ssr: false },
);

const DownloadModal = dynamic(
  () => import("@/features/messenger/components/DownloadModal").then((m) => m.DownloadModal),
  { ssr: false },
);

/**
 * Loads the DownloadModal bundle on first request instead of on every page —
 * removes ~40 KB of unused JS from first load for the ~99% of visitors who
 * never open it. Listens for the same "sv:open-download-modal" event (also
 * caught by the modal itself once mounted) plus the store flag directly,
 * since the homepage promo CTA can fire before the modal chunk is loaded.
 */
function DownloadModalGate() {
  const open = useMessengerUiStore((s) => s.downloadModalOpen);
  const setOpen = useMessengerUiStore((s) => s.setDownloadModalOpen);
  const [everOpened, setEverOpened] = useState(false);

  useEffect(() => {
    if (open) setEverOpened(true);
  }, [open]);

  useEffect(() => {
    function onOpenDownload() {
      setOpen(true);
      setEverOpened(true);
    }
    window.addEventListener("sv:open-download-modal", onOpenDownload);
    return () => window.removeEventListener("sv:open-download-modal", onOpenDownload);
  }, [setOpen]);

  if (!everOpened) return null;
  return <DownloadModal />;
}

const GlobalActivityRoot = dynamic(
  () =>
    import("@/features/notifications/components/GlobalActivityRoot").then(
      (m) => m.GlobalActivityRoot,
    ),
  { ssr: false },
);

function DeferredHeavyShell() {
  const { isAuthenticated, isHydrated } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      setReady(true);
      return;
    }
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const idleMs = mobile ? 6500 : 3500;
    const schedule =
      typeof requestIdleCallback === "function"
        ? (cb: () => void) => requestIdleCallback(cb, { timeout: idleMs })
        : (cb: () => void) => window.setTimeout(cb, mobile ? 4000 : 2000);
    const id = schedule(() => setReady(true));
    return () => {
      if (typeof cancelIdleCallback === "function" && typeof id === "number") {
        cancelIdleCallback(id);
      } else {
        window.clearTimeout(id as number);
      }
    };
  }, [isAuthenticated, isHydrated]);

  if (!ready) return null;

  return (
    <>
      <PodcastMiniPlayer />
      <MessengerRoot />
      <GlobalActivityRoot />
    </>
  );
}

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
          <ModerationWarningHost />
          <PermanentBanModalHost />
          <LoginGateModal />
          <ContactModal />
          <CookieConsentRoot />
          <BackToTop />
          <HeartbeatBeacon />
          <DownloadModalGate />
          <DeferredHeavyShell />
        </AuthProvider>
      </QueryProvider>
    </NuqsAdapter>
  );
}
