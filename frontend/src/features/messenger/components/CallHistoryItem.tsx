"use client";

import { cn } from "@/shared/lib/cn";
import { formatRelativeDate } from "@/shared/lib/formatRelativeDate";
import type { CallHistoryItem as CallHistory } from "../types";

const STATUS_LABEL: Record<CallHistory["status"], string> = {
  ACCEPTED: "Прието",
  REJECTED: "Отказано",
  MISSED: "Пропуснато",
  CANCELLED: "Отменено",
};

function formatDuration(seconds: number | null): string {
  if (seconds == null) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function CallHistoryItem({ item, currentUserId }: { item: CallHistory; currentUserId: number }) {
  const incoming = item.receiverId === currentUserId;
  const label = incoming ? item.callerName : item.receiverName;

  return (
    <div className="flex justify-center py-1">
      <div className="flex items-center gap-2 rounded-[var(--radius-pill)] bg-[color:var(--color-surface-muted)] px-3 py-1.5 text-xs text-[color:var(--color-text-secondary)]">
        <i
          className={cn(
            "bi",
            item.isVideoCall ? "bi-camera-video" : "bi-telephone",
            item.status === "MISSED" || item.status === "REJECTED"
              ? "text-[color:var(--color-error)]"
              : "text-primary",
          )}
        />
        <span>
          {incoming ? "Входящо" : "Изходящо"} {item.isVideoCall ? "видео" : "аудио"} · {label}
        </span>
        <span>· {STATUS_LABEL[item.status]}</span>
        {item.durationSeconds != null && <span>· {formatDuration(item.durationSeconds)}</span>}
        <span className="text-[color:var(--color-text-muted)]">{formatRelativeDate(item.startTime)}</span>
      </div>
    </div>
  );
}
