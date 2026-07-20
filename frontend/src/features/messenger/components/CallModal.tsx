"use client";

import { Avatar } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import type { CurrentCall } from "../store/callStore";
import type { CallUiState } from "../types";

interface CallModalProps {
  callState: CallUiState;
  currentCall: CurrentCall | null;
  onAccept: () => void;
  onReject: () => void;
  onEnd: () => void;
}

/** Incoming/outgoing ringing overlay on the main window (popup handles connected). */
export function CallModal({ callState, currentCall, onAccept, onReject, onEnd }: CallModalProps) {
  if (!currentCall || callState === "idle" || callState === "connected") return null;

  const name =
    currentCall.conversation?.otherUser.fullName ||
    currentCall.conversation?.otherUser.username ||
    currentCall.callerName ||
    "Потребител";
  const avatar =
    currentCall.conversation?.otherUser.imageUrl || currentCall.callerAvatar || null;
  const username = currentCall.conversation?.otherUser.username || name;

  return (
    <div className="fixed inset-0 z-[1150] flex items-center justify-center bg-black/50 p-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-[var(--radius-lg)] border border-border-default/60 bg-white px-6 py-8 shadow-[var(--shadow-dropdown)]">
        <Avatar username={username} imageUrl={avatar} size={72} />
        <div className="text-center">
          <p className="text-lg font-bold text-[color:var(--color-text-heading)]">{name}</p>
          <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
            {callState === "incoming"
              ? currentCall.isVideoCall
                ? "Входящо видео обаждане…"
                : "Входящо обаждане…"
              : currentCall.isVideoCall
                ? "Изходящо видео обаждане…"
                : "Изходящо обаждане…"}
          </p>
        </div>

        <div className="flex items-center gap-4 pt-2">
          {callState === "incoming" ? (
            <>
              <button
                type="button"
                onClick={onReject}
                aria-label="Откажи"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--color-error)] text-xl text-white"
              >
                <i className="bi bi-telephone-x-fill" />
              </button>
              <button
                type="button"
                onClick={onAccept}
                aria-label="Приеми"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--color-success)] text-xl text-white"
              >
                <i className="bi bi-telephone-fill" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onEnd}
              aria-label="Прекрати"
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--color-error)] text-xl text-white",
              )}
            >
              <i className="bi bi-telephone-x-fill" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
