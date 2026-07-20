"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Button } from "@/shared/ui";
import { useMessengerUiStore } from "../store/messengerUiStore";

/** Guest / mobile FAB destination — port of legacy `SVDownloadModal`. */
export function DownloadModal() {
  const open = useMessengerUiStore((s) => s.downloadModalOpen);
  const setOpen = useMessengerUiStore((s) => s.setDownloadModalOpen);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[1090] bg-black/40 backdrop-blur-[2px] transition-opacity data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <Dialog.Popup className="fixed inset-0 z-[1091] flex items-center justify-center p-4 outline-none">
          <div className="w-full max-w-[420px] rounded-[var(--radius-lg)] bg-white p-6 shadow-[var(--shadow-lg)] transition-all data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            <Dialog.Title className="text-lg font-bold text-[color:var(--color-text-heading)]">
              SVMessenger
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-[color:var(--color-text-secondary)]">
              Чат в реално време от телефона. Изтегли приложението и остани свързан със съгражданите си.
            </Dialog.Description>

            {/* eslint-disable-next-line @next/next/no-img-element -- static promo asset */}
            <img
              src="/svmessenger/img/svapp_promo_premium.jpg"
              alt=""
              className="mt-4 w-full rounded-[var(--radius-md)] object-cover"
            />

            <div className="mt-6 flex justify-end gap-3">
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
                className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-pill)] bg-[image:var(--gradient-primary)] px-4 text-sm font-semibold text-white shadow-[var(--shadow-md)]"
              >
                <i className="bi bi-download" />
                Изтегли APK
              </a>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
