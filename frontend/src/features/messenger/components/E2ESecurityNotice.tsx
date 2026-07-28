"use client";

import { cn } from "@/shared/lib/cn";

interface E2ESecurityNoticeProps {
  className?: string;
  compact?: boolean;
  /** When false, the peer has no published key yet. */
  active?: boolean;
}

/**
 * Status of client-side E2E (ECDH P-256 + AES-GCM). Private keys stay in
 * IndexedDB; the server only ever sees ciphertext for DIRECT chats.
 */
export function E2ESecurityNotice({
  className,
  compact = false,
  active = true,
}: E2ESecurityNoticeProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2",
        compact
          ? "justify-center px-2 py-1 text-[10px] text-[color:var(--color-text-muted)]"
          : "rounded-[var(--radius-md)] bg-emerald-50/80 px-3 py-2 text-xs text-[color:var(--color-text-muted)]",
        className,
      )}
    >
      <i
        className={cn(
          "bi shrink-0",
          active ? "bi-shield-lock text-emerald-600" : "bi-shield text-[color:var(--color-text-muted)]",
        )}
        aria-hidden
      />
      <p className={cn("leading-snug", compact ? "text-center" : "")}>
        {compact ? (
          active ? (
            <>Криптиране от край до край · ECDH</>
          ) : (
            <>Криптирането ще се активира, когато и двамата имате ключ</>
          )
        ) : (
          <>
            <span className="font-semibold text-emerald-800">Криптиране от край до край.</span>{" "}
            Съобщенията се криптират на устройството с ECDH P-256 + AES-GCM. Сървърът съхранява
            само шифротекста.
          </>
        )}
      </p>
    </div>
  );
}
