"use client";

import { useForgotPassword } from "../hooks/useForgotPassword";
import { AuthFormFeedback, authFieldClassName } from "./AuthFormFeedback";

interface ForgotPasswordFormProps {
  onBackToLogin?: () => void;
}

/** Email-only forgot-password form — used inside the global auth modal. */
export function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const { form, onSubmit, serverError, successMessage, devResetLink } = useForgotPassword();
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  if (successMessage) {
    return (
      <div className="space-y-4">
        <AuthFormFeedback success={successMessage} />
        {devResetLink ? (
          <p className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-900">
            Local/dev: mailbox providers often block localhost links. Use this link directly:{" "}
            <a href={devResetLink} className="break-all font-medium underline">
              {devResetLink}
            </a>
          </p>
        ) : null}
        {onBackToLogin && (
          <button
            type="button"
            onClick={onBackToLogin}
            className="block w-full text-center text-sm font-semibold text-primary hover:underline"
          >
            ← Назад към входа
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <AuthFormFeedback error={serverError} />

      <div>
        <label htmlFor="forgot-email" className="block text-sm font-medium text-[color:var(--color-text-primary)]">
          Имейл
        </label>
        <input
          id="forgot-email"
          type="email"
          autoComplete="email"
          placeholder="Въведете имейл"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "forgot-email-error" : undefined}
          {...register("email")}
          className={authFieldClassName(!!errors.email)}
        />
        {errors.email && (
          <p id="forgot-email-error" className="mt-1 text-xs text-red-600">
            {errors.email.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-brand w-full rounded-[var(--radius-pill)] px-5 py-2.5 text-sm font-semibold shadow-[var(--shadow-md)] transition-all hover:shadow-[var(--shadow-lg)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Изпращане..." : "Изпрати линк за възстановяване"}
      </button>

      {onBackToLogin && (
        <button
          type="button"
          onClick={onBackToLogin}
          className="block w-full text-center text-sm font-semibold text-primary hover:underline"
        >
          ← Назад към входа
        </button>
      )}
    </form>
  );
}
