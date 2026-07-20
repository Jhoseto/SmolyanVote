"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Container } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { MOTIVATION_PANELS } from "../data/motivationPanels";

/** "Защо SmolyanVote е различен?" — 3-col expandable panels (v1). */
export function MotivationPanels() {
  const [openId, setOpenId] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (sectionRef.current && !sectionRef.current.contains(e.target as Node)) {
        setOpenId(null);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenId(null);
    }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="bg-[#f8f9fa] py-16 md:py-24"
      id="motivation-section"
    >
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-gradient-brand text-[clamp(1.75rem,4vw,2.5rem)] font-bold">
            Защо SmolyanVote е различен?
          </h2>
          <p className="mt-4 text-[color:var(--color-text-secondary)]">
            В социалните мрежи печели популярността, в медиите - парите, в
            SmolyanVote - печелиш ти! SmolyanVote е място, където общественото
            мнение не се редактира преди да го видиш.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {MOTIVATION_PANELS.map((panel) => {
            const open = openId === panel.id;
            return (
              <div
                key={panel.id}
                className={cn(
                  "min-h-[180px] rounded-[16px] border bg-white transition-all duration-300",
                  open
                    ? "-translate-y-2 border-primary/40 shadow-[0_16px_40px_rgba(25,134,28,0.14)]"
                    : "border-border-default/60 shadow-[var(--shadow-sm)] hover:-translate-y-1 hover:shadow-[var(--shadow-md)]",
                )}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenId(open ? null : panel.id);
                  }}
                  aria-expanded={open}
                  className="relative flex w-full flex-col items-start gap-3 p-5 text-left"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-[image:var(--gradient-primary)] text-[1.35rem] text-white shadow-[0_6px_16px_rgba(25,134,28,0.25)]">
                    <i className={cn("bi", panel.icon)} />
                  </span>
                  <span className="pr-10">
                    <span className="block font-semibold text-[color:var(--color-text-heading)]">
                      {panel.title}
                    </span>
                    <span className="mt-1 block text-sm text-[color:var(--color-text-muted)]">
                      {panel.preview}
                    </span>
                  </span>
                  <span className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--color-surface-muted)] text-[color:var(--color-text-muted)]">
                    <i className={cn("bi bi-chevron-down text-sm transition-transform", open && "rotate-180")} />
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5" onClick={(e) => e.stopPropagation()}>
                        <p className="text-sm text-[color:var(--color-text-secondary)]">{panel.details}</p>
                        <ul className="mt-4 space-y-2">
                          {panel.features.map((feature) => (
                            <li
                              key={feature}
                              className="flex items-start gap-2 rounded-[8px] border-l-[3px] border-primary bg-[rgba(25,134,28,0.06)] px-3 py-2 text-sm text-[color:var(--color-text-primary)]"
                            >
                              <i className="bi bi-check-circle-fill mt-0.5 text-primary" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
