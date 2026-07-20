"use client";

import { useRegister } from "../hooks/useRegister";
import { AuthFormFeedback, authFieldClassName } from "./AuthFormFeedback";

interface RegisterFormProps {
  onGoToLogin?: () => void;
}

/** v1 `registration.html` parity (username/email/password/confirm + terms checkbox, honeypot + timestamp anti-spam). */
export function RegisterForm({ onGoToLogin }: RegisterFormProps) {
  const { form, onSubmit, serverError, successMessage } = useRegister();
  const {
    register,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  if (successMessage) {
    return (
      <div className="space-y-4">
        <AuthFormFeedback success={successMessage} />
        {onGoToLogin && (
          <button
            type="button"
            onClick={onGoToLogin}
            className="block w-full text-center text-sm font-semibold text-primary hover:underline"
          >
            ← Към входа
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <AuthFormFeedback error={serverError} />

      <input
        type="text"
        name="middleName"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-px w-px opacity-0"
      />

      <div>
        <label htmlFor="register-username" className="block text-sm font-medium text-[color:var(--color-text-primary)]">
          Потребителско име
        </label>
        <input
          id="register-username"
          type="text"
          autoComplete="username"
          placeholder="Въведете потребителско име"
          aria-invalid={!!errors.username}
          aria-describedby={errors.username ? "register-username-error" : undefined}
          {...register("username")}
          className={authFieldClassName(!!errors.username)}
        />
        {errors.username && (
          <p id="register-username-error" className="mt-1 text-xs text-red-600">
            {errors.username.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="register-email" className="block text-sm font-medium text-[color:var(--color-text-primary)]">
          Имейл адрес
        </label>
        <input
          id="register-email"
          type="email"
          autoComplete="email"
          placeholder="Въведете имейл"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "register-email-error" : undefined}
          {...register("email")}
          className={authFieldClassName(!!errors.email)}
        />
        {errors.email && (
          <p id="register-email-error" className="mt-1 text-xs text-red-600">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="register-password" className="block text-sm font-medium text-[color:var(--color-text-primary)]">
          Парола
        </label>
        <input
          id="register-password"
          type="password"
          autoComplete="new-password"
          placeholder="Създайте парола"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "register-password-error" : undefined}
          {...register("password")}
          className={authFieldClassName(!!errors.password)}
        />
        {errors.password && (
          <p id="register-password-error" className="mt-1 text-xs text-red-600">
            {errors.password.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="register-confirm-password"
          className="block text-sm font-medium text-[color:var(--color-text-primary)]"
        >
          Повторете паролата
        </label>
        <input
          id="register-confirm-password"
          type="password"
          autoComplete="new-password"
          placeholder="Повторете паролата"
          aria-invalid={!!errors.confirmPassword}
          aria-describedby={errors.confirmPassword ? "register-confirm-password-error" : undefined}
          {...register("confirmPassword")}
          className={authFieldClassName(!!errors.confirmPassword)}
        />
        {errors.confirmPassword && (
          <p id="register-confirm-password-error" className="mt-1 text-xs text-red-600">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <div>
        <label className="flex items-start gap-2 text-sm text-[color:var(--color-text-secondary)]">
          <input type="checkbox" {...register("acceptTerms")} className="mt-0.5 h-4 w-4 rounded border-border-default/60" />
          <span>
            С тази регистрация вие потвърждавате, че сте запознати и ще спазвате нашите{" "}
            <a href="/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Условия за ползване и Политика за поверителност
            </a>{" "}
            на платформата!
          </span>
        </label>
        {errors.acceptTerms && <p className="mt-1 text-xs text-red-600">{errors.acceptTerms.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !watch("acceptTerms")}
        className="w-full rounded-[var(--radius-pill)] bg-[image:var(--gradient-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-md)] transition-all hover:shadow-[var(--shadow-lg)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Регистрация..." : "Регистрирай се"}
      </button>

      {onGoToLogin && (
        <p className="text-center text-sm text-[color:var(--color-text-secondary)]">
          Вече имаш акаунт?{" "}
          <button
            type="button"
            onClick={onGoToLogin}
            className="font-semibold text-primary hover:underline"
          >
            Вход
          </button>
        </p>
      )}
    </form>
  );
}
