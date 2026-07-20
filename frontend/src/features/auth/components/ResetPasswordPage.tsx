"use client";

import { useSearchParams } from "next/navigation";
import { ResetPasswordForm } from "./ResetPasswordForm";

/** v1 `reset_password.html` parity — hero background + centered card. Token comes from the emailed link. */
export function ResetPasswordPage() {
  const token = useSearchParams().get("token")?.trim() || null;

  return (
    <section
      className="relative flex min-h-[calc(100vh-var(--navbar-height))] items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-24"
      style={{ backgroundImage: "url('/images/web/login.webp')" }}
    >
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative w-full max-w-md rounded-[var(--radius-lg)] bg-white p-6 shadow-[var(--shadow-lg)] sm:p-8">
        <h1 className="text-center text-2xl font-bold text-[color:var(--color-text-heading)]">
          Възстановяване на парола
        </h1>

        {token ? (
          <>
            <p className="mt-2 text-center text-sm text-[color:var(--color-text-secondary)]">
              Въведете новата си парола.
            </p>
            <div className="mt-6">
              <ResetPasswordForm token={token} />
            </div>
          </>
        ) : (
          <p role="alert" className="mt-6 rounded-[var(--radius-md)] bg-red-50 px-3.5 py-3 text-sm text-red-700">
            Липсва токен за възстановяване. Моля, използвайте линка от имейла.
          </p>
        )}
      </div>
    </section>
  );
}
