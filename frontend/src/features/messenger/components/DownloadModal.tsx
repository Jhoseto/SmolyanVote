"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMessengerUiStore } from "../store/messengerUiStore";

const PROMO_IMAGE = "/svmessenger/img/svapp_promo_premium.jpg";
const APK_URL = "/svmessenger.apk";

const FEATURES = [
  "Мигновени съобщения и известия",
  "Независима платформа от хора за хора",
  "Без реклами и алгоритмичен натиск",
];

function IconClose() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden>
      <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg viewBox="0 0 16 16" width="17" height="17" fill="currentColor" aria-hidden>
      <path d="M8 1a.75.75 0 0 1 .75.75v7.19l2.22-2.22a.75.75 0 1 1 1.06 1.06l-3.5 3.5a.75.75 0 0 1-1.06 0l-3.5-3.5a.75.75 0 0 1 1.06-1.06l2.22 2.22V1.75A.75.75 0 0 1 8 1Z" />
      <path d="M2 10.25a.75.75 0 0 1 .75.75v1.5c0 .14.11.25.25.25h10a.25.25 0 0 0 .25-.25V11a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 13 14.25H3A1.75 1.75 0 0 1 1.25 12.5V11A.75.75 0 0 1 2 10.25Z" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg viewBox="0 0 16 16" width="10" height="10" fill="none" aria-hidden>
      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden>
      <path d="M8 1a3.25 3.25 0 0 1 3.25 3.25V6h.25A1.5 1.5 0 0 1 13 7.5v5A1.5 1.5 0 0 1 11.5 14h-7A1.5 1.5 0 0 1 3 12.5v-5A1.5 1.5 0 0 1 4.5 6h.25V4.25A3.25 3.25 0 0 1 8 1Zm1.75 5V4.25a1.75 1.75 0 1 0-3.5 0V6h3.5Z" />
    </svg>
  );
}

function IconSparkle() {
  return (
    <svg viewBox="0 0 16 16" width="10" height="10" fill="currentColor" aria-hidden>
      <path d="M8 1.5c.3 2.4 1 4.3 2.1 5.4S13 8.1 14.5 8.5c-1.5.4-3.3 1-4.4 1.6S8.3 12.8 8 15.2c-.3-2.4-1-4.3-2.1-5.4S3 8.5 1.5 8.5c1.5-.4 3.3-1 4.4-1.6S7.7 3.9 8 1.5Z" />
    </svg>
  );
}

/**
 * SVMessenger download promo. Rendered by `DownloadModalGate` in
 * `AppProviders.tsx`, which owns opening the modal (both the direct store
 * flag used by the FAB/share-dialog, and the "sv:open-download-modal" event
 * dispatched by the homepage promo card) — this component only reads state
 * and handles closing, so opening logic lives in exactly one place.
 *
 * Layout note: the card is a single scrollable flex block (image + copy +
 * actions all in normal document flow). No flex-1/grid "flexible middle row"
 * tricks — those can collapse to zero height on short viewports and hide the
 * copy entirely. Simple flow means the actions button can never disappear.
 */
export function DownloadModal() {
  const open = useMessengerUiStore((s) => s.downloadModalOpen);
  const setOpen = useMessengerUiStore((s) => s.setDownloadModalOpen);
  const [mounted, setMounted] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, setOpen]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sv-download-title"
      className="fixed inset-0 z-[1091] flex items-center justify-center p-4 sm:p-6"
    >
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-[#02160f]/78 backdrop-blur-md"
      />

      {/* Ambient brand glow behind the card — premium, not distracting */}
      <div
        aria-hidden
        className="pointer-events-none absolute h-[420px] w-[420px] rounded-full opacity-40 blur-[90px] md:h-[560px] md:w-[560px]"
        style={{ background: "var(--gradient-primary)" }}
      />

      <div
        className="relative z-[1] flex w-full max-w-[380px] flex-col overflow-y-auto overflow-x-hidden rounded-[28px] bg-white shadow-[var(--shadow-promo),0_30px_80px_-20px_rgba(2,44,34,0.55)] ring-1 ring-black/[0.04] md:max-w-[760px] md:flex-row"
        style={{ maxHeight: "min(92dvh, 620px)" }}
      >
        <button
          ref={closeRef}
          type="button"
          aria-label="Затвори"
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[color:var(--color-text-secondary)] shadow-[0_2px_10px_rgba(0,0,0,0.18)] ring-1 ring-black/[0.06] backdrop-blur-sm transition hover:bg-white hover:text-[color:var(--color-text-heading)] md:right-4 md:top-4 md:h-9 md:w-9"
        >
          <IconClose />
        </button>

        {/* Visual — full phone artwork always visible on a premium brand backdrop */}
        <div
          className="relative flex h-[188px] w-full shrink-0 items-center justify-center overflow-hidden md:h-auto md:w-[288px]"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 8%, #17503c 0%, #0a3328 42%, #051f18 78%, #03150f 100%)",
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[85%] w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 blur-[48px]"
            style={{ background: "radial-gradient(circle, rgba(216,181,94,0.38), transparent 68%)" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(115deg, #fff 0px, #fff 1px, transparent 1px, transparent 3px)",
            }}
          />
          <img
            src={PROMO_IMAGE}
            alt="SVMessenger приложение"
            width={453}
            height={1024}
            decoding="async"
            className="relative z-[1] h-[164px] w-auto object-contain drop-shadow-[0_18px_36px_rgba(0,0,0,0.5)] md:h-[300px] md:max-h-[80%]"
          />
        </div>

        {/* Copy + actions — one natural flow, never hidden or clipped */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="px-5 pb-4 pt-4 md:px-8 md:pb-2 md:pt-8">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-0.5 text-[0.65rem] font-extrabold uppercase tracking-[0.14em] text-primary-700">
              <IconSparkle />
              SV Messenger
            </span>
            <h2
              id="sv-download-title"
              className="mt-2.5 font-display text-[1.32rem] font-bold leading-[1.15] tracking-[-0.02em] text-[color:var(--color-text-heading)] md:text-[1.8rem]"
            >
              Свободата да общуваш
            </h2>
            <p className="mt-1.5 text-[0.83rem] leading-relaxed text-[color:var(--color-text-secondary)] md:mt-3 md:text-[0.93rem]">
              Чат в реално време от телефона. Остани свързан със съгражданите си, където и да си.
            </p>

            <ul className="mt-3.5 space-y-1.5 md:mt-5 md:space-y-2.5">
              {FEATURES.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2.5 text-[0.8rem] leading-snug text-[color:var(--color-text-secondary)] md:text-[0.9rem]"
                >
                  <span
                    className="flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-full text-white"
                    style={{ backgroundImage: "var(--gradient-primary)" }}
                  >
                    <IconCheck />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>

            <p className="mt-3.5 flex items-center gap-1.5 rounded-[10px] bg-primary-50 px-2.5 py-1.5 text-[0.68rem] leading-snug text-primary-800 md:mt-5 md:text-[0.74rem]">
              <span className="shrink-0 text-primary-600">
                <IconLock />
              </span>
              Криптиране от край до край — ECDH P-256 + AES-GCM
            </p>
          </div>

          <div className="mt-auto flex flex-col gap-2 border-t border-black/[0.06] px-5 py-3.5 md:flex-row md:justify-end md:gap-3 md:px-8 md:py-5">
            <a
              href={APK_URL}
              download
              className="btn-brand inline-flex h-11 w-full items-center justify-center gap-2 rounded-full px-6 text-[0.9rem] font-semibold shadow-[var(--shadow-md)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)] md:order-2 md:w-auto"
            >
              <IconDownload />
              Изтегли APK
            </a>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-11 w-full items-center justify-center rounded-full border border-primary/30 bg-white text-[0.9rem] font-semibold text-primary transition hover:border-primary hover:bg-primary-50 md:order-1 md:w-auto md:px-6"
            >
              Затвори
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
