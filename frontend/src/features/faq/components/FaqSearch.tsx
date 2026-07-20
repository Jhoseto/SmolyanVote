"use client";

interface FaqSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function FaqSearch({ value, onChange }: FaqSearchProps) {
  return (
    <div className="relative mx-auto max-w-xl">
      <i className="bi bi-search pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--color-text-muted)]" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Търсете въпрос или отговор..."
        aria-label="Търсене в често задаваните въпроси"
        className="w-full rounded-[var(--radius-pill)] border border-border-default/60 bg-white py-3 pl-11 pr-4 text-sm text-[color:var(--color-text-primary)] shadow-[var(--shadow-sm)] outline-none transition-colors focus:border-primary"
      />
    </div>
  );
}
