/** AEO: concise answer-first paragraph for featured snippets and AI extraction. */
export function AnswerFirstBlock({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-6 rounded-[var(--radius-md)] border border-border-default/60 bg-[color:var(--color-surface-light)] px-4 py-3 text-[0.95rem] leading-relaxed text-[color:var(--color-text-secondary)]">
      <strong className="font-semibold text-[color:var(--color-text-heading)]">Кратък отговор: </strong>
      {children}
    </p>
  );
}
