interface AuthFormFeedbackProps {
  error?: string | null;
  success?: string | null;
}

/**
 * Inline auth feedback for the modal — server errors / success messages
 * stay in-dialog (not toast behind the overlay).
 */
export function AuthFormFeedback({ error, success }: AuthFormFeedbackProps) {
  if (error) {
    return (
      <p
        role="alert"
        aria-live="assertive"
        className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
      >
        {error}
      </p>
    );
  }

  if (success) {
    return (
      <p
        role="status"
        aria-live="polite"
        className="rounded-[var(--radius-md)] border border-green-200 bg-green-50 px-3.5 py-2.5 text-sm text-green-700"
      >
        {success}
      </p>
    );
  }

  return null;
}

/** Shared input chrome — red border + focus when the field has a live error. */
export function authFieldClassName(invalid: boolean): string {
  return [
    "mt-1.5 w-full rounded-[var(--radius-md)] border px-3.5 py-2.5 text-sm outline-none transition-colors",
    invalid
      ? "border-red-400 bg-red-50/40 focus:border-red-500"
      : "border-border-default/60 focus:border-primary",
  ].join(" ");
}
