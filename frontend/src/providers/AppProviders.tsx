"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { Suspense, useEffect, useState } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { QueryProvider } from "./QueryProvider";
import { AuthProvider } from "./AuthProvider";
import { useAuth } from "@/shared/lib/authContext";
import { GoogleTranslateProvider } from "@/lib/i18n-web-translate";
import { Toaster, ConfirmDialogHost, BackToTop, HeartbeatBeacon, ModerationWarningHost, PermanentBanModalHost } from "@/shared/ui";
import { CookieConsentRoot } from "@/features/cookie-consent";
import { ContactModalQuerySync } from "@/features/contacts";
import { useMessengerUiStore } from "@/features/messenger/store/messengerUiStore";
import { useLoginGateStore } from "@/shared/lib/loginGateStore";
import { useContactModalStore } from "@/shared/lib/contactModalStore";

const MessengerRoot = dynamic(
  () => import("@/features/messenger/components/MessengerRoot").then((m) => m.MessengerRoot),
  { ssr: false },
);

const DownloadModal = dynamic(
  () => import("@/features/messenger/components/DownloadModal").then((m) => m.DownloadModal),
  { ssr: false },
);

const PodcastMiniPlayer = dynamic(
  () => import("@/features/podcast").then((m) => m.PodcastMiniPlayer),
  { ssr: false },
);

const LoginGateModalImpl = dynamic(
  () => import("@/features/auth").then((m) => m.LoginGateModal),
  { ssr: false },
);

const ContactModalImpl = dynamic(
  () => import("@/features/contacts").then((m) => m.ContactModal),
  { ssr: false },
);

/**
 * Auth modal (login/register/forgot) is opened imperatively from dozens of
 * gated actions across the app (`useRequireAuth`, navbar CTAs, etc.) via
 * `useLoginGateStore`. It drags in framer-motion + three validated forms —
 * gating it here keeps that ~90 KB out of first load for the vast majority
 * of visits that never need to log in.
 */
function LoginGateModalGate() {
  const isOpen = useLoginGateStore((s) => s.isOpen);
  const [everOpened, setEverOpened] = useState(false);

  useEffect(() => {
    if (isOpen) setEverOpened(true);
  }, [isOpen]);

  if (!everOpened) return null;
  return <LoginGateModalImpl />;
}

/**
 * Contact form modal, gated the same way. `ContactModalQuerySync` (tiny,
 * always mounted below) still opens it instantly via the `?contact=1`
 * deep-link even before this chunk has loaded.
 */
function ContactModalGate() {
  const isOpen = useContactModalStore((s) => s.isOpen);
  const [everOpened, setEverOpened] = useState(false);

  useEffect(() => {
    if (isOpen) setEverOpened(true);
  }, [isOpen]);

  if (!everOpened) return null;
  return <ContactModalImpl />;
}

/**
 * Loads the DownloadModal bundle on first request instead of on every page —
 * removes ~40 KB of unused JS from first load for the ~99% of visitors who
 * never open it. This is the single place that owns "opening" the modal:
 * it reacts to the store flag (set directly by the FAB / share dialog) and
 * to the "sv:open-download-modal" event (dispatched by the homepage promo
 * card, which can fire before the modal chunk has even loaded).
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
          <LoginGateModalGate />
          <Suspense fallback={null}>
            <ContactModalQuerySync />
          </Suspense>
          <ContactModalGate />
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
