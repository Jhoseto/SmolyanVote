const GTAG_ID = "G-9G3Y2XM1JE";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let analyticsLoaded = false;

function gtag(...args: unknown[]): void {
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(args);
}

/** Denies everything except strictly-necessary cookies, before any consent decision. */
export function setDefaultDeniedConsent(): void {
  gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    functionality_storage: "denied",
    personalization_storage: "denied",
    security_storage: "granted",
    wait_for_update: 500,
  });
}

function loadAnalyticsScript(): void {
  if (analyticsLoaded || document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`)) {
    analyticsLoaded = true;
    return;
  }
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GTAG_ID}`;
  script.onload = () => {
    gtag("js", new Date());
    gtag("config", GTAG_ID, {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
    analyticsLoaded = true;
  };
  document.head.appendChild(script);
}

/** Applies analytics-only consent (this platform never uses ads). */
export function updateConsent(analyticsGranted: boolean): void {
  gtag("consent", "update", {
    analytics_storage: analyticsGranted ? "granted" : "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    functionality_storage: analyticsGranted ? "granted" : "denied",
    personalization_storage: analyticsGranted ? "granted" : "denied",
  });

  if (analyticsGranted) loadAnalyticsScript();
}
