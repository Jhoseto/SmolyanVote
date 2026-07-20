"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/shared/lib/authContext";
import { useLoginGateStore } from "@/shared/lib/loginGateStore";

/**
 * Landing target for the web OAuth JWT bridge (see backend
 * `OAuth2AuthenticationSuccessHandler`).
 */
export function OAuthCallbackPage() {
  const searchParams = useSearchParams();
  const { setSession } = useAuth();
  const router = useRouter();
  const openAuth = useLoginGateStore((s) => s.open);
  const handled = useRef(false);

  const accessToken = searchParams.get("accessToken");
  const refreshToken = searchParams.get("refreshToken");
  const error = searchParams.get("error");

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    if (accessToken) {
      setSession(accessToken, refreshToken ?? undefined, true);
      router.replace("/");
    }
  }, [accessToken, refreshToken, setSession, router]);

  if (error || !accessToken) {
    const message = decodeOAuthError(error);
    return (
      <section className="flex min-h-[70vh] items-center justify-center px-4 py-24 text-center">
        <div className="max-w-md">
          <p className="text-red-700">{message}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm">
            <button
              type="button"
              onClick={() => {
                openAuth("login");
                router.push("/");
              }}
              className="font-semibold text-primary hover:underline"
            >
              Отвори вход
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-4 py-24">
      <p className="text-[color:var(--color-text-secondary)]">Влизане...</p>
    </section>
  );
}

function decodeOAuthError(error: string | null): string {
  if (!error) {
    return "Вход чрез Google/Facebook не бе успешен. Проверете дали backend сесията работи (на local HTTP cookie-тата не трябва да са Secure).";
  }
  try {
    const decoded = decodeURIComponent(error.replace(/\+/g, " "));
    if (decoded.includes("вече е регистриран с email и парола")) {
      return decoded;
    }
    if (decoded === "user_not_found") {
      return "Акаунтът не бе намерен след OAuth вход. Опитайте отново.";
    }
    if (decoded === "unsupported_provider") {
      return "Неподдържан OAuth провайдър.";
    }
    if (decoded.toLowerCase().includes("authorization_request_not_found")) {
      return "OAuth сесията се изгуби (често заради Secure cookie на http://localhost). Рестартирайте backend-а и опитайте отново.";
    }
    // Keep Spring error codes visible for diagnosis (e.g. [invalid_token_response])
    return decoded;
  } catch {
    return "Вход чрез Google/Facebook не бе успешен.";
  }
}
