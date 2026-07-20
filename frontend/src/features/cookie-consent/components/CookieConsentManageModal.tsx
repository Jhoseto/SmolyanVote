"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import Link from "next/link";
import { useConsentStore } from "../lib/consentStore";

export function CookieConsentManageModal() {
  const isOpen = useConsentStore((s) => s.isManageOpen);
  const analytics = useConsentStore((s) => s.analytics);
  const closeManage = useConsentStore((s) => s.closeManage);
  const savePreferences = useConsentStore((s) => s.savePreferences);
  const reject = useConsentStore((s) => s.reject);

  const [analyticsPref, setAnalyticsPref] = useState(analytics);

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) closeManage();
        else setAnalyticsPref(analytics);
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[1090] bg-black/40 backdrop-blur-[2px] transition-opacity data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <Dialog.Popup className="fixed inset-0 z-[1091] flex items-center justify-center p-4 outline-none">
          <div className="w-full max-w-[480px] rounded-[var(--radius-lg)] bg-white shadow-[var(--shadow-lg)] transition-all data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0">
            <div className="flex items-center justify-between border-b border-border-default/60 px-6 py-4">
              <Dialog.Title className="text-lg font-bold text-[color:var(--color-text-heading)]">
                Управление на бисквитките
              </Dialog.Title>
              <Dialog.Close
                aria-label="Затвори"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--color-text-muted)] transition-colors hover:bg-[color:var(--color-surface-muted)]"
              >
                <i className="bi bi-x-lg text-sm" />
              </Dialog.Close>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm text-[color:var(--color-text-secondary)]">
                Можете да управлявате вашите предпочитания за бисквитките тук.
              </p>

              <div className="mt-4 flex items-center gap-2 rounded-[var(--radius-md)] border border-border-default/60 bg-[color:var(--color-surface-light)] p-4">
                <div className="flex-1 opacity-60">
                  <p className="text-sm font-semibold text-[color:var(--color-text-heading)]">
                    Необходими бисквитки
                  </p>
                  <p className="mt-0.5 text-xs text-[color:var(--color-text-muted)]">
                    Задължителни за работата на сайта (вход, сесия) — не могат да бъдат изключени.
                  </p>
                </div>
                <span className="text-xs font-semibold text-[color:var(--color-text-muted)]">Винаги активни</span>
              </div>

              <label className="mt-3 flex items-center gap-3 rounded-[var(--radius-md)] border border-border-default/60 p-4">
                <input
                  type="checkbox"
                  checked={analyticsPref}
                  onChange={(e) => setAnalyticsPref(e.target.checked)}
                  className="h-5 w-9 shrink-0 cursor-pointer appearance-none rounded-full bg-[color:var(--color-surface-muted)] transition-colors checked:bg-primary relative before:absolute before:left-0.5 before:top-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:shadow before:transition-transform checked:before:translate-x-4"
                />
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-[color:var(--color-text-heading)]">
                    Аналитични бисквитки
                  </span>
                  <span className="mt-0.5 block text-xs text-[color:var(--color-text-secondary)]">
                    Помагат ни да разберем как посетителите използват сайта — анонимизирано, без реклами.
                  </span>
                </span>
              </label>

              <p className="mt-4 text-xs text-[color:var(--color-text-muted)]">
                За повече информация вижте нашата{" "}
                <Link href="/terms-and-conditions#cookies" className="font-medium text-primary underline">
                  Cookie политика
                </Link>
                .
              </p>
            </div>

            <div className="flex justify-end gap-2 border-t border-border-default/60 px-6 py-4">
              <button
                type="button"
                onClick={reject}
                className="rounded-[var(--radius-pill)] border border-border-default px-4 py-2 text-sm font-medium text-[color:var(--color-text-primary)] transition-colors hover:border-primary hover:text-primary"
              >
                Откажи всички
              </button>
              <button
                type="button"
                onClick={() => savePreferences(analyticsPref)}
                className="rounded-[var(--radius-pill)] bg-[image:var(--gradient-primary)] px-5 py-2 text-sm font-semibold text-white shadow-[var(--shadow-md)] transition-all hover:shadow-[var(--shadow-lg)]"
              >
                Запази предпочитания
              </button>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
