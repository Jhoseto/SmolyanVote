const COOKIE_NAME = "smolyanvote_cookie_consent";
const COOKIE_EXPIRY_DAYS = 397; // 13 months (GDPR max) — v1 parity

export type ConsentValue = "accepted" | "rejected";

export interface ConsentData {
  consent: ConsentValue;
  timestamp: number;
  analytics: boolean;
}

function isSecureContext(): boolean {
  return (
    window.location.protocol === "https:" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}

function readRawCookie(name: string): string | null {
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return match ? match.substring(name.length + 1) : null;
}

function isValid(data: unknown): data is ConsentData {
  if (!data || typeof data !== "object") return false;
  const d = data as Partial<ConsentData>;
  if (d.consent !== "accepted" && d.consent !== "rejected") return false;
  if (typeof d.timestamp !== "number") return false;
  const expiry = d.timestamp + COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() <= expiry;
}

export function loadConsent(): ConsentData | null {
  if (typeof document === "undefined") return null;
  try {
    const raw = readRawCookie(COOKIE_NAME);
    if (raw) {
      const parsed = JSON.parse(decodeURIComponent(raw));
      if (isValid(parsed)) return parsed;
    }
    const fromStorage = window.localStorage.getItem(COOKIE_NAME);
    if (fromStorage) {
      const parsed = JSON.parse(fromStorage);
      if (isValid(parsed)) return parsed;
    }
  } catch {
    // Malformed cookie/storage value — treat as no consent, not a crash.
  }
  return null;
}

export function saveConsent(consent: ConsentValue, analytics: boolean): ConsentData {
  const data: ConsentData = { consent, timestamp: Date.now(), analytics };

  const expires = new Date();
  expires.setTime(expires.getTime() + COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  let cookieString = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(data))}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  if (isSecureContext()) cookieString += "; Secure";
  document.cookie = cookieString;

  try {
    window.localStorage.setItem(COOKIE_NAME, JSON.stringify(data));
  } catch {
    // localStorage unavailable (private mode) — cookie already persisted.
  }

  return data;
}
