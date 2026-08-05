"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { Suspense, useEffect, useState } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { QueryProvider } from "./QueryProvider";
import { AuthProvider } from "./AuthProvider";
import { useAuth } from "@/shared/lib/authContext";
import { Toaster, ConfirmDialogHost, BackToTop, HeartbeatBeacon, ModerationWarningHost, PermanentBanModalHost } from "@/shared/ui";
import { ContactModalQuerySync } from "@/features/contacts";
import { useMessengerUiStore } from "@/features/messenger/store/messengerUiStore";
import { useIsDesktopMessenger } from "@/features/messenger/lib/isDesktopMessenger";
import { MessengerFabAnon } from "@/features/messenger/components/MessengerFabAnon";
import { useLoginGateStore } from "@/shared/lib/loginGateStore";
import { useContactModalStore } from "@/shared/lib/contactModalStore";
import { onShareToChat } from "@/shared/lib/shareToChat";

const MessengerRoot = dynamic(
  () => import("@/features/messenger/components/MessengerRoot").then((m) => m.MessengerRoot),
  { ssr: false },
);

const MessengerFabImpl = dynamic(
  () => import("@/features/messenger/components/MessengerFab").then((m) => m.MessengerFab),
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

const GoogleTranslateProvider = dynamic(
  () => import("@/lib/i18n-web-translate").then((m) => m.GoogleTranslateProvider),
  { ssr: false },
);

const CookieConsentRoot = dynamic(
  () => import("@/features/cookie-consent").then((m) => m.CookieConsentRoot),
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

/**
 * The FAB has to *look* instant (it's a persistent piece of chrome), so it's
 * mounted unconditionally — but the *authenticated* `MessengerFab` imports
 * `useUnreadCount` → `useStompConnectionState` → `@stomp/stompjs`
 * (statically, at module scope). Rendering that version for anonymous
 * visitors too would silently drag the ~39 KiB gzipped STOMP chunk back
 * into every anonymous page load, defeating `MessengerRootGate` below.
 * `MessengerFabAnon` is a dependency-free lookalike used until auth is
 * confirmed, so anonymous visitors never touch that import at all.
 */
function MessengerFabGate() {
  const { isAuthenticated, isHydrated } = useAuth();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  if (isHydrated && isAuthenticated) return <MessengerFabImpl />;
  return <MessengerFabAnon />;
}

/**
 * `PublicationShareSheet` (and similar "share" actions) dispatch a
 * `shareToChat(...)` window event that the real `ShareToChatDialog` (bundled
 * inside `MessengerRoot`) listens for. For anonymous users / non-desktop
 * messenger layouts that dialog never mounts, so this tiny, always-mounted
 * fallback covers the same cases it would otherwise handle (routing to the
 * download promo) — see `ShareToChatDialog.tsx` for the mirrored condition.
 * For authenticated desktop users the real dialog is already mounted and
 * handles the event itself; this fallback simply no-ops for that case.
 */
function ShareToChatFallbackGate() {
  const { isAuthenticated } = useAuth();
  const isDesktopMessenger = useIsDesktopMessenger();
  const setDownloadModalOpen = useMessengerUiStore((s) => s.setDownloadModalOpen);

  useEffect(
    () =>
      onShareToChat(() => {
        if (!isAuthenticated || !isDesktopMessenger) setDownloadModalOpen(true);
      }),
    [isAuthenticated, isDesktopMessenger, setDownloadModalOpen],
  );

  return null;
}

/**
 * The full messenger shell (STOMP client, LiveKit call controller, panel,
 * floating windows — ~80 KiB gzipped) is only ever functional for logged-in
 * visitors: `useMessengerRealtime` disconnects/no-ops without a user. Rather
 * than idle-loading it for anonymous visitors too (it used to load a few
 * seconds after idle regardless of auth), it now only mounts once
 * authentication is confirmed — removing that whole bundle from anonymous
 * page loads, which is the vast majority of homepage visits.
 */
function MessengerRootGate() {
  const { isAuthenticated, isHydrated } = useAuth();
  if (!isHydrated || !isAuthenticated) return null;
  return <MessengerRoot />;
}

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
      <GlobalActivityRoot />
    </>
  );
}

/**
 * Cookie banner + Google Translate chrome — not needed for LCP. Idle-mount
 * after first paint so their JS stays off the critical path on mobile Slow 4G.
 * Banner still appears within ~1–2s (well within consent UX norms).
 */
function DeferredSecondaryShell() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const idleMs = mobile ? 2000 : 800;
    const schedule =
      typeof requestIdleCallback === "function"
        ? (cb: () => void) => requestIdleCallback(cb, { timeout: idleMs })
        : (cb: () => void) => window.setTimeout(cb, mobile ? 1200 : 400);
    const id = schedule(() => setReady(true));
    return () => {
      if (typeof cancelIdleCallback === "function" && typeof id === "number") {
        cancelIdleCallback(id);
      } else {
        window.clearTimeout(id as number);
      }
    };
  }, []);

  if (!ready) return null;
  return (
    <>
      <GoogleTranslateProvider />
      <CookieConsentRoot />
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
          <Toaster />
          <ConfirmDialogHost />
          <ModerationWarningHost />
          <PermanentBanModalHost />
          <LoginGateModalGate />
          <Suspense fallback={null}>
            <ContactModalQuerySync />
          </Suspense>
          <ContactModalGate />
          <DeferredSecondaryShell />
          <BackToTop />
          <HeartbeatBeacon />
          <DownloadModalGate />
          <MessengerFabGate />
          <ShareToChatFallbackGate />
          <MessengerRootGate />
          <DeferredHeavyShell />
        </AuthProvider>
      </QueryProvider>
    </NuqsAdapter>
  );
}
