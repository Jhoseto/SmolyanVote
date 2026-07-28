"use client";

import Image from "next/image";
import { Dialog } from "@base-ui/react/dialog";
import { Button } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useMessengerUiStore } from "../store/messengerUiStore";
import { E2ESecurityNotice } from "./E2ESecurityNotice";

/** Guest / mobile FAB destination — port of legacy `SVDownloadModal`. */
export function DownloadModal() {
  const open = useMessengerUiStore((s) => s.downloadModalOpen);
  const setOpen = useMessengerUiStore((s) => s.setDownloadModalOpen);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[1090] bg-emerald-950/70 backdrop-blur-md transition-opacity data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <Dialog.Popup className="fixed inset-0 z-[1091] flex items-start justify-center overflow-y-auto p-3 outline-none sm:items-center sm:p-4">
          <div
            className={cn(
              "relative my-3 flex w-full max-w-[880px] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.55)]",
              "transition-all data-[starting-style]:scale-[0.97] data-[starting-style]:opacity-0 data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0",
              "max-h-[min(94dvh,680px)] sm:my-0 sm:max-h-[min(92dvh,640px)] sm:flex-row",
            )}
          >
            <Dialog.Close
              aria-label="Затвори"
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/5 text-[color:var(--color-text-heading)] transition-colors hover:bg-black/10"
            >
              <i className="bi bi-x-lg" />
            </Dialog.Close>

            <div className="flex shrink-0 items-center justify-center bg-[#022c22] px-4 py-5 sm:w-[min(42%,280px)] sm:py-6">
              <Image
                src="/svmessenger/img/svapp_promo_premium.jpg"
                alt="SVMessenger приложение"
                width={453}
                height={1024}
                className="h-auto max-h-[min(44dvh,460px)] w-auto max-w-full object-contain sm:max-h-[min(82dvh,580px)]"
                priority
              />
            </div>

            <div className="flex min-h-0 min-w-0 flex-1 flex-col p-5 sm:p-8">
              <div className="shrink-0 pr-8">
                <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-600">
                  SV Messenger
                </span>
                <Dialog.Title className="mt-1 font-display text-2xl font-bold tracking-[-0.02em] text-[color:var(--color-text-heading)] sm:text-[1.75rem]">
                  Свободата да общуваш
                </Dialog.Title>
                <Dialog.Description className="mt-3 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                  Чат в реално време от телефона. Изтегли приложението и остани свързан със
                  съгражданите си.
                </Dialog.Description>
              </div>

              <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
                <E2ESecurityNotice className="mb-4" />
                <ul className="space-y-2 text-sm text-[color:var(--color-text-secondary)]">
                  <li className="flex items-start gap-2">
                    <i className="bi bi-check-circle-fill mt-0.5 text-emerald-600" />
                    Мигновени съобщения и известия
                  </li>
                  <li className="flex items-start gap-2">
                    <i className="bi bi-check-circle-fill mt-0.5 text-emerald-600" />
                    Независима платформа от хора за хора
                  </li>
                  <li className="flex items-start gap-2">
                    <i className="bi bi-check-circle-fill mt-0.5 text-emerald-600" />
                    Без реклами и алгоритмичен натиск
                  </li>
                </ul>
              </div>

              <div className="mt-5 flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-border-default/40 pt-4">
                <Dialog.Close
                  render={
                    <Button type="button" variant="outline" size="sm">
                      Затвори
                    </Button>
                  }
                />
                <a
                  href="/svmessenger.apk"
                  download
                  className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-pill)] bg-emerald-600 px-5 text-sm font-semibold text-white shadow-[var(--shadow-md)] transition-colors hover:bg-emerald-700"
                >
                  <i className="bi bi-download" />
                  Изтегли APK
                </a>
              </div>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
