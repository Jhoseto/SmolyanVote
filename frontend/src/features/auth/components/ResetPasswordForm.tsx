"use client";

import { useRouter } from "next/navigation";
import { useLoginGateStore } from "@/shared/lib/loginGateStore";
import { useResetPassword } from "../hooks/useResetPassword";
import { AuthFormFeedback, authFieldClassName } from "./AuthFormFeedback";

interface ResetPasswordFormProps {
  token: string;
}

/** Token deep-link form — stays on `/reset-password`; opens auth modal for login. */
export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const openAuth = useLoginGateStore((s) => s.open);
  const { form, onSubmit, serverError, successMessage } = useResetPassword(token);
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  function goToLogin() {
    openAuth("login");
    router.push("/");
  }

  if (successMessage) {
    return (
      <div className="space-y-4">
        <AuthFormFeedback success={successMessage} />
        <button
          type="button"
          onClick={goToLogin}
          className="block w-full text-center text-sm font-semibold text-primary hover:underline"
        >
          Към входа
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <AuthFormFeedback error={serverError} />

      <div>
        <label htmlFor="reset-password" className="block text-sm font-medium text-[color:var(--color-text-primary)]">
          Нова парола
        </label>
        <input
          id="reset-password"
          type="password"
          autoComplete="new-password"
          placeholder="Въведете нова парола"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "reset-password-error" : undefined}
          {...register("password")}
          className={authFieldClassName(!!errors.password)}
        />
        {errors.password && (
          <p id="reset-password-error" className="mt-1 text-xs text-red-600">
            {errors.password.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="reset-confirm-password"
          className="block text-sm font-medium text-[color:var(--color-text-primary)]"
        >
          Потвърди парола
        </label>
        <input
          id="reset-confirm-password"
          type="password"
          autoComplete="new-password"
          placeholder="Потвърди новата парола"
          aria-invalid={!!errors.confirmPassword}
          aria-describedby={errors.confirmPassword ? "reset-confirm-password-error" : undefined}
          {...register("confirmPassword")}
          className={authFieldClassName(!!errors.confirmPassword)}
        />
        {errors.confirmPassword && (
          <p id="reset-confirm-password-error" className="mt-1 text-xs text-red-600">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-brand w-full rounded-[var(--radius-pill)] px-5 py-2.5 text-sm font-semibold shadow-[var(--shadow-md)] transition-all hover:shadow-[var(--shadow-lg)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Обновяване..." : "Обнови парола"}
      </button>

      <button
        type="button"
        onClick={goToLogin}
        className="block w-full text-center text-sm font-semibold text-primary hover:underline"
      >
        ← Назад към входа
      </button>
    </form>
  );
}
