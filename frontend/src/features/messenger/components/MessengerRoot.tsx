"use client";

import { useEffect } from "react";
import { useMessengerRealtime } from "../hooks/useMessengerRealtime";
import { useMessengerShortcuts } from "../hooks/useMessengerShortcuts";
import { usePublishE2EKey } from "../hooks/useE2EKeys";
import { setCallSignalHandler, useCallController } from "../hooks/useCallController";
import { useAuth } from "@/shared/lib/authContext";
import { useMessengerUiStore } from "../store/messengerUiStore";
import { useMessengerPrefsStore } from "../store/messengerPrefsStore";
import { useIsDesktopMessenger } from "../lib/isDesktopMessenger";
import { MessengerPanel } from "./MessengerPanel";
import { FloatingChatWindow } from "./FloatingChatWindow";
import { MessengerDock } from "./MessengerDock";
import { CommandPalette } from "./CommandPalette";
import { QuickReplyToast } from "./QuickReplyToast";
import { ShareToChatDialog } from "./ShareToChatDialog";
import { CallModal } from "./CallModal";
import { AudioDeviceSelector } from "./AudioDeviceSelector";
import { ConnectionBanner } from "./ConnectionBanner";
import "./messenger-desktop.css";

/**
 * App-wide messenger shell (MODERN_FRONTEND_PLAN.md Фаза 8) — mounted in
 * `AppProviders`, but only once the visitor is authenticated (it is 100%
 * inert for anonymous users: `useMessengerRealtime` no-ops without a user,
 * and the FAB/share-to-chat entry points route anonymous clicks to the
 * download promo instead — see `MessengerFabGate`/`ShareToChatFallbackGate`
 * in `AppProviders.tsx`, which cover those without needing this bundle).
 * STOMP client + multi-window chat + LiveKit call controller — the
 * heaviest client feature in the app (~80 KiB gzipped across two chunks),
 * so keeping it fully out of anonymous first loads is a real, measured win.
 */
export function MessengerRoot() {
  useMessengerRealtime();
  const { user } = useAuth();
  usePublishE2EKey(Boolean(user), user?.id);

  const activeChats = useMessengerUiStore((s) => s.activeChats);
  const reflowWindows = useMessengerUiStore((s) => s.reflowWindows);
  const density = useMessengerPrefsStore((s) => s.density);
  const isDesktop = useIsDesktopMessenger();
  const call = useCallController();

  useMessengerShortcuts(isDesktop);

  useEffect(() => {
    setCallSignalHandler(call.handleIncomingSignal);
    return () => setCallSignalHandler(null);
  }, [call.handleIncomingSignal]);

  useEffect(() => {
    let frame = 0;
    function onResize() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(reflowWindows);
    }
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, [reflowWindows]);

  return (
    <div className="sv-msg" data-density={density}>
      <MessengerPanel />
      <ConnectionBanner />
      <MessengerDock />
      <QuickReplyToast />
      {isDesktop && <CommandPalette />}
      <ShareToChatDialog />

      {isDesktop &&
        activeChats.map((chat) => (
          <FloatingChatWindow
            key={chat.conversationId}
            chat={chat}
            onStartCall={(id, isVideo) => void call.startCall(id, isVideo)}
          />
        ))}

      <CallModal
        callState={call.callState}
        currentCall={call.currentCall}
        onAccept={() => void call.acceptCall()}
        onReject={call.rejectCall}
        onEnd={call.endCall}
      />

      <AudioDeviceSelector
        open={call.showDeviceSelector}
        mode={call.deviceSelectorMode}
        onComplete={call.onDeviceSelectorComplete}
        onCancel={call.onDeviceSelectorCancel}
      />
    </div>
  );
}
