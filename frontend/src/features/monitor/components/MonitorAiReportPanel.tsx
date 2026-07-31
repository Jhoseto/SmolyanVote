"use client";

import type { MonitorAiFinding, MonitorAiReport } from "../types";

interface MonitorAiReportPanelProps {
  report: MonitorAiReport;
}

function FindingList({ title, items }: { title: string; items: MonitorAiFinding[] }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <h3 className="font-display text-[0.92rem] font-semibold text-[color:var(--color-text-heading)]">
        {title}
      </h3>
      <ul className="space-y-2">
        {items.map((f, i) => (
          <li
            key={`${f.title}-${i}`}
            className="rounded-[var(--radius-md)] border border-border-default/25 bg-white/90 px-3 py-2.5"
          >
            <p className="text-[0.82rem] font-semibold text-[color:var(--color-text-heading)]">
              {f.title}
            </p>
            <p className="mt-1 text-[0.8rem] leading-relaxed text-[color:var(--color-text-secondary)]">
              {f.body}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MonitorAiReportPanel({ report }: MonitorAiReportPanelProps) {
  if (!report.aiGenerated) return null;

  return (
    <section className="space-y-4 rounded-[var(--radius-lg)] border border-primary/20 bg-primary-50/40 p-5">
      <p className="text-[0.72rem] font-semibold uppercase tracking-wide text-primary">
        SmolyanVote синтезиран доклад · от {report.generatedAt ? new Date(report.generatedAt).toLocaleDateString("bg-BG") : "данните"}
      </p>

      {report.conclusions.length > 0 && (
        <div className="space-y-1">
          <h3 className="font-display text-[0.92rem] font-semibold">Заключения</h3>
          <ul className="list-disc space-y-1 pl-5 text-[0.85rem] leading-relaxed text-[color:var(--color-text-secondary)]">
            {report.conclusions.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      <FindingList title="Къде изтичат парите" items={report.moneyLeaks} />
      <FindingList title="Какво е нередно" items={report.irregularities} />

      {report.watchNext.length > 0 && (
        <div className="space-y-1">
          <h3 className="font-display text-[0.92rem] font-semibold">Какво да следите</h3>
          <ul className="list-disc space-y-1 pl-5 text-[0.82rem] text-[color:var(--color-text-muted)]">
            {report.watchNext.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
