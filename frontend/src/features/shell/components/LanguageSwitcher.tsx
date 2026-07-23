"use client";

import { useEffect, useRef, useState } from "react";
import { translateTo } from "@/lib/i18n-web-translate";
import {
  LANGUAGE_LABELS,
  SUPPORTED_LANGUAGES,
  type Language,
} from "@/lib/i18n/locales";
import { cn } from "@/shared/lib/cn";

interface LanguageSwitcherProps {
  className?: string;
  /** Localized "Languages" trigger label (i18n Layer 2). */
  label: string;
}

/** Custom language dropdown (v1 parity) driving hidden Google Translate. */
export function LanguageSwitcher({ className, label }: LanguageSwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, []);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 font-sans text-[0.875rem] font-light tracking-wide text-[color:var(--color-text-nav-muted)] transition-all duration-200 hover:bg-black/[0.035] hover:text-primary"
      >
        <i className="bi bi-globe2 text-[1.05rem]" />
        <span>{label}</span>
        <i
          className={cn(
            "bi bi-chevron-down text-xs transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[200px] overflow-hidden rounded-[var(--radius-md)] border border-border-default/60 bg-white/95 py-2 shadow-[var(--shadow-dropdown)] backdrop-blur-md"
          // notranslate — keep language names in native script (v1 parity)
          translate="no"
        >
          {SUPPORTED_LANGUAGES.map((lang: Language) => (
            <button
              key={lang}
              type="button"
              onClick={() => translateTo(lang)}
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-[0.875rem] font-light tracking-wide text-[color:var(--color-text-primary)] transition-colors hover:bg-primary-50 hover:text-primary"
            >
              <span className={`fi fi-${LANGUAGE_LABELS[lang].flag}`} />
              <span>{LANGUAGE_LABELS[lang].native}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
