"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLoginGateStore } from "@/shared/lib/loginGateStore";
import { authApi } from "../api";

type ConfirmState = "pending" | "success" | "error";

/** v1 `/confirm?userId&code` parity — activates the account, no page of its own in v1 (redirect-only). */
export function ConfirmPage() {
  const router = useRouter();
  const openAuth = useLoginGateStore((s) => s.open);
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const code = searchParams.get("code");

  function openLogin() {
    openAuth("login");
    router.push("/");
  }

  function openRegister() {
    openAuth("register");
    router.push("/");
  }

  const missingParams = !userId || !code;

  const [state, setState] = useState<ConfirmState>(missingParams ? "error" : "pending");
  const [message, setMessage] = useState<string>(
    missingParams ? "Липсва потребител или код за потвърждение." : "Потвърждаване на имейл...",
  );

  useEffect(() => {
    if (!userId || !code) return;

    let cancelled = false;
    authApi
      .confirmEmail(Number(userId), code)
      .then((response) => {
        if (cancelled) return;
        setState(response.success ? "success" : "error");
        setMessage(response.message);
      })
      .catch(() => {
        if (cancelled) return;
        setState("error");
        setMessage("Невалиден код или акаунтът вече е активиран.");
      });

    return () => {
      cancelled = true;
    };
  }, [userId, code]);

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-4 py-24">
      <div className="w-full max-w-md rounded-[var(--radius-lg)] bg-white p-6 text-center shadow-[var(--shadow-lg)] sm:p-8">
        {state === "pending" && <p className="text-[color:var(--color-text-secondary)]">{message}</p>}

        {state === "success" && (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <i className="bi bi-check-lg text-2xl text-green-600" />
            </div>
            <p className="mt-4 text-[color:var(--color-text-primary)]">{message}</p>
            <button
              type="button"
              onClick={openLogin}
              className="btn-brand mt-6 inline-flex h-11 items-center justify-center rounded-[var(--radius-pill)] px-6 text-sm font-semibold shadow-[var(--shadow-md)] transition-all hover:shadow-[var(--shadow-lg)]"
            >
              Към входа
            </button>
          </>
        )}

        {state === "error" && (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
              <i className="bi bi-x-lg text-2xl text-red-600" />
            </div>
            <p className="mt-4 text-red-700">{message}</p>
            <button
              type="button"
              onClick={openRegister}
              className="mt-6 inline-block text-sm font-semibold text-primary hover:underline"
            >
              Обратно към регистрация
            </button>
          </>
        )}
      </div>
    </section>
  );
}
