/** Self-hosted desktop font set — same families/weights as before, no Google CDN hop. */
export const DESKTOP_FONTS_CSS = "/fonts/desktop/fonts.css";

/** Manrope cyrillic (variable font, covers 400–700) — hero title on desktop. */
export const DESKTOP_FONT_PRELOAD_MANROPE_CY = "/fonts/desktop/xn7gYHE41ni1AdIRggOxSuXd.woff2";

/** Self-hosted mobile subset — loaded non-blocking after first paint. */
export const MOBILE_FONTS_CSS = "/fonts/mobile/fonts.css";

/**
 * Tiny Manrope-only sheet (cyrillic + latin) — inlined on mobile so the
 * hero title can paint without a fonts.css network hop. Full mobile sheet
 * (Inter / Source Sans / IBM Plex) is deferred via NonBlockingStylesheet.
 */
export const MOBILE_FONTS_CRITICAL_CSS = "/fonts/mobile/fonts-critical.css";

/** Manrope 500 cyrillic — hero title on mobile. */
export const MOBILE_FONT_PRELOAD_MANROPE_500_CY =
  "/fonts/mobile/xn7gYHE41ni1AdIRggOxSuXd.woff2";

/** Below-fold footer decoration — never on the LCP critical path. */
export const FOOTER_CSS = "/styles/footer.css";

/** Self-hosted bootstrap icons (full set, font-display: swap). */
export const BOOTSTRAP_ICONS_CSS = "/fonts/bootstrap-icons.css";

/** Shell/home icon subset — mobile first paint (~2.6 KiB). Full set loads later. */
export const BOOTSTRAP_ICONS_SHELL_CSS = "/fonts/bootstrap-icons-shell.css";

export const FLAG_ICONS_CSS =
  "https://cdn.jsdelivr.net/npm/flag-icons@7.2.3/css/flag-icons.min.css";
