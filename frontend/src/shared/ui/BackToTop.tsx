"use client";

import { useEffect, useState } from "react";

/** React port of v1 `initializeBackToTop()` — same 400px threshold + debounce. */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const onScroll = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setVisible(window.scrollY > 400);
      }, 100);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(timeout);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Връщане в началото"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`fixed bottom-6 right-6 z-[1070] flex h-11 w-11 items-center justify-center rounded-full bg-[image:var(--gradient-primary)] text-white shadow-[var(--shadow-lg)] transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <i className="bi bi-arrow-up text-lg" />
    </button>
  );
}
