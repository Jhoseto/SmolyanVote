"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { applyStoredLanguage } from "./googleTranslate";
import { shouldLoadGoogleTranslateOnBoot } from "./ensureGoogleTranslate";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate: {
        TranslateElement: new (
          options: { pageLanguage: string },
          elementId: string,
        ) => void;
      };
    };
  }
}

const HIDE_STYLE_ID = "sv-hide-google-translate-chrome";

const HIDE_CSS = `
body > .skiptranslate,
iframe.goog-te-banner-frame,
.goog-te-banner-frame,
iframe.skiptranslate,
.VIpgJd-ZVi9od-ORHb-OEVmcd,
iframe.VIpgJd-ZVi9od-ORHb-OEVmcd {
  display: none !important;
  visibility: hidden !important;
  height: 0 !important;
  max-height: 0 !important;
  border: none !important;
  opacity: 0 !important;
  pointer-events: none !important;
  z-index: -1 !important;
}
html, body {
  top: 0 !important;
  position: static !important;
  margin-top: 0 !important;
}
`;

function ensureHideStyle() {
  if (document.getElementById(HIDE_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = HIDE_STYLE_ID;
  style.textContent = HIDE_CSS;
  document.head.appendChild(style);
}

function hideEl(el: HTMLElement) {
  el.style.setProperty("display", "none", "important");
  el.style.setProperty("visibility", "hidden", "important");
  el.style.setProperty("height", "0", "important");
  el.style.setProperty("max-height", "0", "important");
  el.style.setProperty("opacity", "0", "important");
  el.style.setProperty("pointer-events", "none", "important");
  el.setAttribute("aria-hidden", "true");
}

function hideGoogleTranslateChrome() {
  ensureHideStyle();

  document.querySelectorAll<HTMLElement>("body > .skiptranslate").forEach((el) => {
    if (el.id === "google_translate_element") return;
    hideEl(el);
  });

  document
    .querySelectorAll<HTMLElement>(
      "iframe.goog-te-banner-frame, .goog-te-banner-frame, iframe.skiptranslate, .VIpgJd-ZVi9od-ORHb-OEVmcd, iframe.VIpgJd-ZVi9od-ORHb-OEVmcd",
    )
    .forEach(hideEl);

  if (document.body) {
    document.body.style.setProperty("top", "0", "important");
    document.body.style.setProperty("position", "static", "important");
    document.body.style.setProperty("margin-top", "0", "important");
  }
  document.documentElement.style.setProperty("margin-top", "0", "important");
}

/**
 * Loads Google Website Translator on demand (language menu or active translation).
 * Default bg-BG homepage skips ~90 KiB translate.googleapis.com until needed.
 */
export function GoogleTranslateProvider() {
  const [scriptEnabled, setScriptEnabled] = useState(false);

  useEffect(() => {
    applyStoredLanguage();
    ensureHideStyle();
    hideGoogleTranslateChrome();

    window.__svEnableGoogleTranslate = () => setScriptEnabled(true);

    if (shouldLoadGoogleTranslateOnBoot()) {
      setScriptEnabled(true);
    }

    return () => {
      delete window.__svEnableGoogleTranslate;
    };
  }, []);

  useEffect(() => {
    if (!scriptEnabled) return;

    window.googleTranslateElementInit = () => {
      if (!window.google?.translate) return;
      new window.google.translate.TranslateElement(
        { pageLanguage: "bg" },
        "google_translate_element",
      );
      [0, 50, 200, 500, 1000, 2000].forEach((ms) => {
        window.setTimeout(hideGoogleTranslateChrome, ms);
      });
    };

    hideGoogleTranslateChrome();

    let scheduled = false;
    const observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        hideGoogleTranslateChrome();
      });
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      delete window.googleTranslateElementInit;
    };
  }, [scriptEnabled]);

  return (
    <>
      <div id="google_translate_element" className="skiptranslate" aria-hidden style={{ display: "none" }} />
      {scriptEnabled && (
        <Script
          src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="lazyOnload"
        />
      )}
    </>
  );
}
