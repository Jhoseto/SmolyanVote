"use client";

import { useLogin } from "../hooks/useLogin";
import { OAuthButtons } from "./OAuthButtons";
import { AuthFormFeedback, authFieldClassName } from "./AuthFormFeedback";
import type { LoginUserSummary } from "../types";

interface LoginFormProps {
  onSuccess?: (user: LoginUserSummary) => void;
  onForgotPassword?: () => void;
  onGoToRegister?: () => void;
}

/** Email/password/remember-me/OAuth — used inside the global auth modal. */
export function LoginForm({ onSuccess, onForgotPassword, onGoToRegister }: LoginFormProps) {
  const { form, onSubmit, serverError } = useLogin(onSuccess);
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <AuthFormFeedback error={serverError} />

      <div>
        <label htmlFor="login-email" className="block text-sm font-medium text-[color:var(--color-text-primary)]">
          Имейл
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="Въведете имейл"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "login-email-error" : undefined}
          {...register("email")}
          className={authFieldClassName(!!errors.email)}
        />
        {errors.email && (
          <p id="login-email-error" className="mt-1 text-xs text-red-600">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="login-password" className="block text-sm font-medium text-[color:var(--color-text-primary)]">
          Парола
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          placeholder="Въведете парола"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "login-password-error" : undefined}
          {...register("password")}
          className={authFieldClassName(!!errors.password)}
        />
        {errors.password && (
          <p id="login-password-error" className="mt-1 text-xs text-red-600">
            {errors.password.message}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-[color:var(--color-text-secondary)]">
          <input type="checkbox" {...register("rememberMe")} className="h-4 w-4 rounded border-border-default/60" />
          Запомни ме
        </label>
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-primary hover:underline"
        >
          Забравена парола?
        </button>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-brand w-full rounded-[var(--radius-pill)] px-5 py-2.5 text-sm font-semibold shadow-[var(--shadow-md)] transition-all hover:shadow-[var(--shadow-lg)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Влизане..." : "Вход"}
      </button>

      <div className="flex items-center gap-3 text-xs text-[color:var(--color-text-muted)]">
        <span className="h-px flex-1 bg-border-default/60" />
        <span>или</span>
        <span className="h-px flex-1 bg-border-default/60" />
      </div>

      <OAuthButtons />

      {onGoToRegister && (
        <p className="text-center text-sm text-[color:var(--color-text-secondary)]">
          Нямаш акаунт?{" "}
          <button
            type="button"
            onClick={onGoToRegister}
            className="font-semibold text-primary hover:underline"
          >
            Регистрация
          </button>
        </p>
      )}
    </form>
  );
}
