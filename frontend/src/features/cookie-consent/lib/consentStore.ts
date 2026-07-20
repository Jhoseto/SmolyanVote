import { create } from "zustand";
import { loadConsent, saveConsent, type ConsentValue } from "./consentCookie";
import { setDefaultDeniedConsent, updateConsent } from "./googleConsentMode";

interface ConsentState {
  hydrated: boolean;
  consent: ConsentValue | null;
  analytics: boolean;
  isManageOpen: boolean;
  hydrate: () => void;
  accept: () => void;
  reject: () => void;
  savePreferences: (analytics: boolean) => void;
  openManage: () => void;
  closeManage: () => void;
}

/**
 * GDPR cookie consent store (13-month cookie + Google Consent Mode v2).
 * `hydrate()` must run once, client-side only, before any gtag call.
 */
export const useConsentStore = create<ConsentState>((set) => ({
  hydrated: false,
  consent: null,
  analytics: false,
  isManageOpen: false,

  hydrate: () => {
    setDefaultDeniedConsent();
    const existing = loadConsent();
    if (existing) {
      updateConsent(existing.consent === "accepted" && existing.analytics);
      set({ hydrated: true, consent: existing.consent, analytics: existing.analytics });
    } else {
      set({ hydrated: true });
    }
  },

  accept: () => {
    const data = saveConsent("accepted", true);
    updateConsent(true);
    set({ consent: data.consent, analytics: data.analytics, isManageOpen: false });
  },

  reject: () => {
    const data = saveConsent("rejected", false);
    updateConsent(false);
    set({ consent: data.consent, analytics: data.analytics, isManageOpen: false });
  },

  savePreferences: (analytics) => {
    const data = saveConsent(analytics ? "accepted" : "rejected", analytics);
    updateConsent(analytics);
    set({ consent: data.consent, analytics: data.analytics, isManageOpen: false });
  },

  openManage: () => set({ isManageOpen: true }),
  closeManage: () => set({ isManageOpen: false }),
}));
