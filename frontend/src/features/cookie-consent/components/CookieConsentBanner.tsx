"use client";

import Link from "next/link";
import { useConsentStore } from "../lib/consentStore";

export function CookieConsentBanner() {
  const hydrated = useConsentStore((s) => s.hydrated);
  const consent = useConsentStore((s) => s.consent);
  const accept = useConsentStore((s) => s.accept);
  const reject = useConsentStore((s) => s.reject);
  const openManage = useConsentStore((s) => s.openManage);

  if (!hydrated || consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie съгласие"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-[1080] border-t border-border-default/60 bg-white/98 px-4 py-4 shadow-[0_-8px_32px_rgba(0,0,0,0.12)] backdrop-blur-md sm:px-6"
    >
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <p className="text-sm text-[color:var(--color-text-secondary)]">
          Използваме аналитични бисквитки, за да подобрим изживяването ви и да анализираме трафика. Прочетете повече в{" "}
          <Link href="/terms-and-conditions#cookies" className="font-medium text-primary underline">
            Условия за ползване
          </Link>
          .
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={openManage}
            className="rounded-[var(--radius-pill)] px-4 py-2 text-sm font-medium text-[color:var(--color-text-secondary)] transition-colors hover:text-primary"
          >
            Настройки
          </button>
          <button
            type="button"
            onClick={reject}
            className="rounded-[var(--radius-pill)] border border-border-default px-4 py-2 text-sm font-medium text-[color:var(--color-text-primary)] transition-colors hover:border-primary hover:text-primary"
          >
            Откажи
          </button>
          <button
            type="button"
            onClick={accept}
            className="rounded-[var(--radius-pill)] bg-[image:var(--gradient-primary)] px-5 py-2 text-sm font-semibold text-white shadow-[var(--shadow-md)] transition-all hover:shadow-[var(--shadow-lg)]"
          >
            Приеми всички
          </button>
        </div>
      </div>
    </div>
  );
}
