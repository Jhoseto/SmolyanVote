"use client";

import type { RiskBadge } from "../types";

export function RiskFlagList({ flags }: { flags: RiskBadge[] }) {
  if (flags.length === 0) return null;
  return (
    <ul className="space-y-2">
      {flags.map((f) => (
        <li
          key={f.code}
          className="rounded-[var(--radius-md)] bg-amber-50 px-3 py-2 text-[0.85rem]"
          title={f.tooltip ?? f.label}
        >
          <span className="font-medium text-amber-900">{f.label}</span>
          {f.tooltip && f.tooltip !== f.label && (
            <p className="mt-0.5 text-[0.78rem] text-amber-800/90">{f.tooltip}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
