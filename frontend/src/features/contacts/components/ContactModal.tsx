"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useContactModalStore } from "@/shared/lib/contactModalStore";
import { ContactForm } from "./ContactForm";

function ContactModalQuerySync() {
  const searchParams = useSearchParams();
  const open = useContactModalStore((s) => s.open);

  useEffect(() => {
    if (searchParams.get("contact") !== "1") return;
    open();
    const url = new URL(window.location.href);
    url.searchParams.delete("contact");
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState({}, "", next || "/");
  }, [searchParams, open]);

  return null;
}

/** Global contact form modal — mounted once in `AppProviders`. */
export function ContactModal() {
  const isOpen = useContactModalStore((s) => s.isOpen);
  const close = useContactModalStore((s) => s.close);

  return (
    <>
      <Suspense fallback={null}>
        <ContactModalQuerySync />
      </Suspense>
      <Dialog.Root open={isOpen} onOpenChange={(open) => !open && close()}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-[1090] bg-black/50 backdrop-blur-[3px] transition-opacity data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
          <Dialog.Popup className="fixed inset-0 z-[1091] flex items-center justify-center overflow-y-auto p-4 outline-none">
            <div className="relative w-full max-w-md rounded-[var(--radius-lg)] bg-white p-6 shadow-[0_25px_80px_rgba(0,0,0,0.28)] transition-all data-[starting-style]:scale-[0.97] data-[starting-style]:opacity-0 data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0 sm:p-8">
              <Dialog.Close
                render={
                  <button
                    type="button"
                    aria-label="Затвори"
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--color-text-muted)] transition-colors hover:bg-black/[0.05] hover:text-[color:var(--color-text-heading)]"
                  >
                    <i className="bi bi-x-lg text-sm" aria-hidden />
                  </button>
                }
              />
              <Dialog.Title className="pr-8 text-center font-display text-2xl font-bold text-[color:var(--color-text-heading)]">
                Свържете се с нас
              </Dialog.Title>
              <div className="mt-6">
                <ContactForm onSuccess={close} />
              </div>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
