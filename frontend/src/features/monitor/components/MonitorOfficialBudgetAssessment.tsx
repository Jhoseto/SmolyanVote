"use client";

import { cn } from "@/shared/lib/cn";
import type { MonitorCitizenAssessment } from "../types";

const VERDICT_STYLES: Record<string, { label: string; className: string; icon: string }> = {
  positive: {
    label: "Положително",
    className: "border-emerald-200 bg-emerald-50/80 text-emerald-950",
    icon: "bi-check-circle",
  },
  mixed: {
    label: "Смесено",
    className: "border-amber-200 bg-amber-50/80 text-amber-950",
    icon: "bi-exclamation-circle",
  },
  negative: {
    label: "Риск",
    className: "border-red-200 bg-red-50/80 text-red-950",
    icon: "bi-x-circle",
  },
  pending: {
    label: "Изчаква отчет",
    className: "border-slate-200 bg-slate-50/80 text-slate-800",
    icon: "bi-hourglass-split",
  },
};

interface MonitorOfficialBudgetAssessmentProps {
  assessment: MonitorCitizenAssessment | null | undefined;
  year: number;
}

export function MonitorOfficialBudgetAssessment({
  assessment,
  year,
}: MonitorOfficialBudgetAssessmentProps) {
  if (!assessment) {
    return null;
  }

  const verdict = VERDICT_STYLES[assessment.verdict] ?? VERDICT_STYLES.pending;

  return (
    <section className="space-y-4 rounded-xl border border-border-default/35 bg-white/95 p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-wide text-[color:var(--color-text-muted)]">
            Гражданска оценка · {year} г.
          </p>
          <h3 className="mt-1 font-display text-[1.05rem] font-bold text-primary">
            {assessment.headline}
          </h3>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.75rem] font-semibold",
            verdict.className,
          )}
        >
          <i className={cn("bi", verdict.icon)} aria-hidden />
          {verdict.label}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <AssessmentCard
          title="Успехи"
          icon="bi-hand-thumbs-up"
          tone="success"
          items={assessment.successes}
        />
        <AssessmentCard
          title="Внимание"
          icon="bi-shield-exclamation"
          tone="warn"
          items={assessment.concerns}
        />
      </div>

      {assessment.citizenImpact && (
        <div className="rounded-lg border border-primary/20 bg-primary-50/40 px-4 py-3">
          <p className="text-[0.72rem] font-semibold uppercase tracking-wide text-primary">
            Какво означава за вас
          </p>
          <p className="mt-1.5 text-[0.88rem] leading-relaxed text-[color:var(--color-text-secondary)]">
            {assessment.citizenImpact}
          </p>
        </div>
      )}
    </section>
  );
}

function AssessmentCard({
  title,
  icon,
  tone,
  items,
}: {
  title: string;
  icon: string;
  tone: "success" | "warn";
  items: string[];
}) {
  if (!items?.length) return null;
  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3",
        tone === "success"
          ? "border-emerald-200/60 bg-emerald-50/40"
          : "border-amber-200/60 bg-amber-50/40",
      )}
    >
      <p className="flex items-center gap-2 text-[0.78rem] font-semibold text-[color:var(--color-text-heading)]">
        <i className={cn("bi", icon)} aria-hidden />
        {title}
      </p>
      <ul className="mt-2 space-y-1.5 text-[0.82rem] leading-relaxed text-[color:var(--color-text-secondary)]">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current opacity-50" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
