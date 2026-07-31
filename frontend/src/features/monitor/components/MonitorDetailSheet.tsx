"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { formatDate, formatEur } from "../lib/format";
import type { MonitorFeedItem } from "../types";
import { RiskBadgeChip } from "./MonitorKpiStrip";
import { useMonitorAuthority } from "./MonitorAuthorityProvider";

interface MonitorDetailSheetProps {
  item: MonitorFeedItem | null;
  onClose: () => void;
}

export function MonitorDetailSheet({ item, onClose }: MonitorDetailSheetProps) {
  const { withAuthority } = useMonitorAuthority();
  const href = item
    ? withAuthority(
        item.itemType === "contract"
          ? `/monitor/contract/${item.id}`
          : `/monitor/document/${item.id}`,
      )
    : "#";
  return (
    <AnimatePresence>
      {item && (
        <>
          <motion.button
            type="button"
            aria-label="Затвори"
            className="fixed inset-0 z-[1100] bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal
            className="fixed inset-x-0 bottom-0 z-[1101] max-h-[75vh] overflow-y-auto rounded-t-[1.25rem] border border-border-default/30 bg-white p-5 shadow-2xl md:inset-x-auto md:left-1/2 md:bottom-auto md:top-1/2 md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[var(--radius-lg)]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border-default/50 md:hidden" />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap gap-2">
                  {item.category && (
                    <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[0.68rem] font-medium text-primary">
                      {item.category}
                    </span>
                  )}
                  <RiskBadgeChip score={item.riskScore} />
                </div>
                <h3 className="font-display text-[1rem] font-semibold leading-snug">{item.title}</h3>
              </div>
              {item.amountEur != null && (
                <p className="shrink-0 font-display text-[1.1rem] font-bold text-primary">
                  {formatEur(item.amountEur)}
                </p>
              )}
            </div>
            {item.shortSummary && (
              <p className="mt-3 text-[0.85rem] leading-relaxed text-[color:var(--color-text-secondary)]">
                {item.shortSummary}
              </p>
            )}
            {item.riskFlags.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {item.riskFlags.map((f) => (
                  <li
                    key={f.code}
                    className="rounded-[var(--radius-md)] bg-amber-50 px-2.5 py-1.5 text-[0.78rem] text-amber-900"
                  >
                    <span className="font-medium">{f.label}</span>
                    {f.tooltip && f.tooltip !== f.label && (
                      <span className="mt-0.5 block text-[0.72rem] text-amber-800/90">{f.tooltip}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-[0.75rem] text-[color:var(--color-text-muted)]">
              {formatDate(item.date ?? item.publishedAt)}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={href}
                className="rounded-full bg-primary px-4 py-2 text-[0.85rem] font-medium text-white"
                onClick={onClose}
              >
                Пълен детайл
              </Link>
              {item.itemType !== "contract" && item.sourceUrl && (
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-border-default px-4 py-2 text-[0.85rem]"
                >
                  Оригинал ↗
                </a>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
