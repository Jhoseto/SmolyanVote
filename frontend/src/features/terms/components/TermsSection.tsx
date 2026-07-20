import type { ReactNode } from "react";

interface TermsSectionProps {
  id?: string;
  title: string;
  children: ReactNode;
}

export function TermsSection({ id, title, children }: TermsSectionProps) {
  return (
    <section id={id} className="target-highlight rounded-[var(--radius-md)] py-4">
      <h2 className="text-lg font-bold text-[color:var(--color-text-heading)]">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
        {children}
      </div>
    </section>
  );
}
