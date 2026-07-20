import { resolveLanguageFromGoogtransCookie, type Language } from "@/lib/i18n/locales";

/**
 * Layer 1 — hidden Google Website Translator.
 * Ported 1:1 from v1 `navbar.js` (cookie `googtrans=/bg/<lang>` + reload).
 * The Google toolbar UI stays hidden; only our own LanguageSwitcher is shown.
 */

const GOOGTRANS_VARIANTS = [
  "googtrans",
  "googtrans=/bg/",
  "googtrans=/auto/bg",
  "googtrans=/bg/bg",
];

function clearGoogtransCookies(): void {
  const host = window.location.hostname;
  GOOGTRANS_VARIANTS.forEach((name) => {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    document.cookie = `${name}=; path=/; domain=${host}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    document.cookie = `${name}=; path=/; domain=.${host}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  });
}

/** Switch page language via Google Translate cookie, then reload (v1 parity). */
export function translateTo(lang: Language): void {
  if (typeof window === "undefined") return;
  clearGoogtransCookies();
  document.cookie = `googtrans=/bg/${lang}; path=/; max-age=31536000`;
  try {
    sessionStorage.setItem("selectedLanguage", lang);
  } catch {
    /* sessionStorage unavailable (private mode) */
  }
  window.location.reload();
}

/** Re-apply the language chosen in a previous session on load. */
export function applyStoredLanguage(): void {
  if (typeof window === "undefined") return;
  try {
    const saved = sessionStorage.getItem("selectedLanguage");
    if (saved && saved !== "bg") {
      document.cookie = `googtrans=/bg/${saved}; path=/; max-age=31536000`;
    }
  } catch {
    /* sessionStorage unavailable */
  }
}

/** Current language from the googtrans cookie, defaults to `bg`. */
export function getCurrentLanguage(): Language {
  if (typeof document === "undefined") return "bg";
  const match = document.cookie.match(/googtrans=(\/[^;]+)/);
  return resolveLanguageFromGoogtransCookie(match?.[1]);
}
