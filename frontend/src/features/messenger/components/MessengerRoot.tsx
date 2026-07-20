"use client";

import { useEffect } from "react";
import { useMessengerRealtime } from "../hooks/useMessengerRealtime";
import { setCallSignalHandler, useCallController } from "../hooks/useCallController";
import { useMessengerUiStore } from "../store/messengerUiStore";
import { MessengerFab } from "./MessengerFab";
import { MessengerPanel } from "./MessengerPanel";
import { DownloadModal } from "./DownloadModal";
import { FloatingChatWindow } from "./FloatingChatWindow";
import { Taskbar } from "./Taskbar";
import { CallModal } from "./CallModal";
import { AudioDeviceSelector } from "./AudioDeviceSelector";
import { ConnectionBanner } from "./ConnectionBanner";

/**
 * App-wide messenger shell (MODERN_FRONTEND_PLAN.md Фаза 8) — mounted in
 * `AppProviders`. STOMP + multi-window chat + LiveKit call controller.
 */
export function MessengerRoot() {
  useMessengerRealtime();

  const activeChats = useMessengerUiStore((s) => s.activeChats);
  const setDownloadModalOpen = useMessengerUiStore((s) => s.setDownloadModalOpen);
  const call = useCallController();

  useEffect(() => {
    setCallSignalHandler(call.handleIncomingSignal);
    return () => setCallSignalHandler(null);
  }, [call.handleIncomingSignal]);

  useEffect(() => {
    function onOpenDownload() {
      setDownloadModalOpen(true);
    }
    window.addEventListener("sv:open-download-modal", onOpenDownload);
    return () => window.removeEventListener("sv:open-download-modal", onOpenDownload);
  }, [setDownloadModalOpen]);

  return (
    <>
      <MessengerFab />
      <MessengerPanel />
      <ConnectionBanner />
      <DownloadModal />
      <Taskbar />

      {activeChats.map((chat) => (
        <FloatingChatWindow
          key={chat.conversationId}
          conversationId={chat.conversationId}
          position={chat.position}
          zIndex={chat.zIndex}
          isMinimized={chat.isMinimized}
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
    </>
  );
}
