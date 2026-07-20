import { useConsentStore } from "../lib/consentStore";

/** Public hook for other features (e.g. footer "Управление на бисквитките" link). */
export function useCookieConsent() {
  const consent = useConsentStore((s) => s.consent);
  const analytics = useConsentStore((s) => s.analytics);
  const openManage = useConsentStore((s) => s.openManage);

  return { consent, analytics, openManage };
}
