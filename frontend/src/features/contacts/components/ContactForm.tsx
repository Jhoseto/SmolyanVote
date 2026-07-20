"use client";

import { useContactForm } from "../hooks/useContactForm";

export function ContactForm() {
  const { form, onSubmit } = useContactForm();
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <input
        type="text"
        name="middleName"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-px w-px opacity-0"
      />

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-[color:var(--color-text-primary)]">
          Име
        </label>
        <input
          id="name"
          type="text"
          autoComplete="off"
          placeholder="Въведете вашето име"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
          {...register("name")}
          className="mt-1.5 w-full rounded-[var(--radius-md)] border border-border-default/60 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary"
        />
        {errors.name && (
          <p id="name-error" className="mt-1 text-xs text-red-600">
            {errors.name.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-[color:var(--color-text-primary)]">
          Имейл адрес
        </label>
        <input
          id="email"
          type="email"
          autoComplete="off"
          placeholder="Въведете вашия имейл"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
          className="mt-1.5 w-full rounded-[var(--radius-md)] border border-border-default/60 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary"
        />
        {errors.email && (
          <p id="email-error" className="mt-1 text-xs text-red-600">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-[color:var(--color-text-primary)]">
          Тема
        </label>
        <input
          id="subject"
          type="text"
          autoComplete="off"
          placeholder="Въведете темата"
          aria-invalid={!!errors.subject}
          aria-describedby={errors.subject ? "subject-error" : undefined}
          {...register("subject")}
          className="mt-1.5 w-full rounded-[var(--radius-md)] border border-border-default/60 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary"
        />
        {errors.subject && (
          <p id="subject-error" className="mt-1 text-xs text-red-600">
            {errors.subject.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-[color:var(--color-text-primary)]">
          Съобщение
        </label>
        <textarea
          id="message"
          rows={5}
          autoComplete="off"
          placeholder="Въведете вашето съобщение"
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "message-error" : undefined}
          {...register("message")}
          className="mt-1.5 w-full resize-none rounded-[var(--radius-md)] border border-border-default/60 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary"
        />
        {errors.message && (
          <p id="message-error" className="mt-1 text-xs text-red-600">
            {errors.message.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-[var(--radius-pill)] bg-[image:var(--gradient-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-md)] transition-all hover:shadow-[var(--shadow-lg)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Изпращане..." : "Изпрати"}
      </button>
    </form>
  );
}
