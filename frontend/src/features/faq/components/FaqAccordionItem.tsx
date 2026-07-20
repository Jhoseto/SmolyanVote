"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/shared/lib/cn";
import type { FaqItemView } from "../hooks/useFaqController";

interface FaqAccordionItemProps {
  item: FaqItemView;
  /** Search match — subtle emphasis, mirrors v1 `.highlighted`. */
  highlighted: boolean;
  onToggle: () => void;
}

export function FaqAccordionItem({ item, highlighted, onToggle }: FaqAccordionItemProps) {
  const questionId = `faq-question-${item.id}`;
  const answerId = `faq-answer-${item.id}`;

  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border bg-white transition-colors",
        highlighted ? "border-primary/50" : "border-border-default/60",
      )}
    >
      <button
        type="button"
        id={questionId}
        aria-expanded={item.open}
        aria-controls={answerId}
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <i className="bi bi-question-circle shrink-0 text-primary" />
        <span className="flex-1 font-medium text-[color:var(--color-text-primary)]">{item.question}</span>
        <i
          className={cn(
            "bi bi-chevron-down shrink-0 text-[color:var(--color-text-muted)] transition-transform",
            item.open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {item.open && (
          <motion.div
            id={answerId}
            role="region"
            aria-labelledby={questionId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <p className="px-4 pb-4 text-sm text-[color:var(--color-text-secondary)]">{item.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
