import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export const createFormInputClass = cn(
  "mt-2 w-full rounded-[14px] border border-black/[0.08] bg-white px-3.5 py-3",
  "font-sans text-[0.95rem] text-[color:var(--color-text-heading)] outline-none transition-all duration-200",
  "placeholder:text-[color:var(--color-text-muted)]/50",
  "shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]",
  "hover:border-primary/30",
  "focus:border-primary focus:shadow-[0_0_0_4px_rgba(25,134,28,0.12)]",
);

export const createFormLabelClass =
  "block font-sans text-[0.88rem] font-semibold tracking-wide text-[color:var(--color-text-heading)]";

export const createFormErrorClass =
  "mt-1.5 flex items-start gap-1.5 font-sans text-[0.78rem] font-medium leading-snug text-red-600";

export const createFormHintClass =
  "mt-1.5 flex items-start gap-1.5 font-sans text-[0.78rem] font-light leading-snug text-[color:var(--color-text-muted)]";

export const createFormCounterClass =
  "shrink-0 rounded-full bg-black/[0.04] px-2 py-0.5 font-sans text-[0.7rem] tabular-nums text-[color:var(--color-text-muted)]";

/** Numbered card section — makes form steps scannable at a glance. */
export function CreateFormSection({
  step,
  title,
  description,
  children,
  className,
}: {
  step: number;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "group/section relative overflow-hidden rounded-[20px] border border-black/[0.06]",
        "bg-gradient-to-br from-[#f7faf8] via-[#fbfcfb] to-white p-4 sm:p-5",
        "shadow-[0_10px_32px_-22px_rgba(15,23,42,0.4)]",
        "transition-shadow duration-300 hover:shadow-[0_16px_40px_-22px_rgba(25,134,28,0.28)]",
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px] bg-[image:var(--gradient-primary)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-primary/[0.06] blur-2xl transition-opacity group-hover/section:opacity-100"
      />

      <header className="relative mb-4 flex gap-3 border-b border-black/[0.05] pb-4">
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[image:var(--gradient-primary)] text-[0.92rem] font-semibold text-white shadow-[0_10px_22px_-10px_rgba(25,134,28,0.8)] ring-4 ring-primary/10">
          {step}
        </span>
        <div className="min-w-0 pt-0.5">
          <h2 className="text-gradient-brand text-balance font-sans text-[1.05rem] font-semibold tracking-[-0.02em]">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 max-w-prose text-pretty font-sans text-[0.8rem] font-light leading-snug text-[color:var(--color-text-secondary)]">
              {description}
            </p>
          ) : null}
        </div>
      </header>
      <div className="relative flex flex-col gap-5">{children}</div>
    </section>
  );
}

/** Single field block: label → control → hint/error. */
export function CreateFormField({
  label,
  htmlFor,
  hint,
  error,
  counter,
  optional,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  counter?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[16px] border border-transparent bg-white/70 p-3 transition-colors hover:border-black/[0.04] hover:bg-white sm:p-3.5">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={htmlFor} className={createFormLabelClass}>
          {label}
          {optional ? (
            <span className="ml-2 inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-[0.68rem] font-medium tracking-wide text-primary ring-1 ring-primary/15">
              по избор
            </span>
          ) : null}
        </label>
        {counter ? <span className={createFormCounterClass}>{counter}</span> : null}
      </div>
      {children}
      {error ? (
        <p className={createFormErrorClass}>
          <i className="bi bi-exclamation-circle mt-px shrink-0 text-[0.85rem]" />
          <span className="text-pretty">{error}</span>
        </p>
      ) : hint ? (
        <p className={createFormHintClass}>
          <i className="bi bi-info-circle mt-px shrink-0 text-[0.85rem] text-primary/55" />
          <span className="text-pretty">{hint}</span>
        </p>
      ) : null}
    </div>
  );
}

export function CreateFormSubmitBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-3 z-10 -mx-1 rounded-[18px] border border-primary/20 bg-gradient-to-r from-white via-primary-50/40 to-white p-3 shadow-[0_16px_40px_-18px_rgba(25,134,28,0.5)] backdrop-blur-md sm:static sm:mx-0 sm:p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="hidden text-pretty font-sans text-[0.75rem] font-light text-[color:var(--color-text-secondary)] sm:block">
          Прегледайте полетата преди изпращане.
        </p>
        {children}
      </div>
    </div>
  );
}

export function DefaultCoverHint({
  imageSrc,
  imageAlt,
}: {
  imageSrc: string;
  imageAlt: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-dashed border-primary/30 bg-gradient-to-r from-primary-50/80 to-white px-3 py-2.5">
      <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-[10px] bg-black/5 ring-1 ring-primary/15 shadow-[0_6px_14px_-8px_rgba(25,134,28,0.45)]">
        <Image src={imageSrc} alt={imageAlt} fill sizes="64px" className="object-cover" />
      </div>
      <p className="text-pretty font-sans text-[0.75rem] font-light leading-snug text-[color:var(--color-text-secondary)]">
        Без качена снимка се ползва тази стандартна корица.
      </p>
    </div>
  );
}
