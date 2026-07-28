"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/shared/lib/cn";
import { useCreatePoll } from "../hooks/usePolls";
import { easeOutQuart } from "../lib/messengerMotion";

const MAX_OPTIONS = 4;

/** Inline 2–4 option poll builder that drops into the composer area. */
export function PollComposer({
  conversationId,
  onClose,
}: {
  conversationId: number;
  onClose: () => void;
}) {
  const createPoll = useCreatePoll(conversationId);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  const filled = options.map((o) => o.trim()).filter(Boolean);
  const valid = question.trim().length > 0 && filled.length >= 2;

  function submit() {
    if (!valid) return;
    createPoll.mutate(
      { question: question.trim(), options: filled },
      { onSuccess: onClose },
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2, ease: easeOutQuart }}
      className="mb-2 overflow-hidden"
    >
      <div className="rounded-[var(--radius-md)] border border-border-default/60 bg-white p-2.5">
        <div className="mb-2 flex items-center justify-between">
          <span className="sv-msg-label flex items-center gap-1.5 text-[color:var(--color-primary)]">
            <i className="bi bi-bar-chart-fill" />
            Бърза анкета
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Затвори анкетата"
            className="text-[color:var(--color-text-muted)] hover:text-[color:var(--color-error)]"
          >
            <i className="bi bi-x" />
          </button>
        </div>

        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value.slice(0, 300))}
          placeholder="Въпрос…"
          aria-label="Въпрос на анкетата"
          autoFocus
          className="mb-2 w-full rounded-[var(--radius-sm)] border border-border-default/60 px-2.5 py-1.5 text-[13px] outline-none focus:border-[color:var(--color-primary)]"
        />

        <div className="flex flex-col gap-1.5">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <input
                value={option}
                onChange={(e) =>
                  setOptions((prev) =>
                    prev.map((o, i) => (i === index ? e.target.value.slice(0, 120) : o)),
                  )
                }
                placeholder={`Опция ${index + 1}`}
                aria-label={`Опция ${index + 1}`}
                className="flex-1 rounded-[var(--radius-sm)] border border-border-default/60 px-2.5 py-1.5 text-[13px] outline-none focus:border-[color:var(--color-primary)]"
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => setOptions((prev) => prev.filter((_, i) => i !== index))}
                  aria-label={`Премахни опция ${index + 1}`}
                  className="text-[color:var(--color-text-muted)] hover:text-[color:var(--color-error)]"
                >
                  <i className="bi bi-dash-circle" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <button
            type="button"
            disabled={options.length >= MAX_OPTIONS}
            onClick={() => setOptions((prev) => [...prev, ""])}
            className={cn(
              "flex items-center gap-1 text-[12px] text-[color:var(--color-primary)]",
              options.length >= MAX_OPTIONS && "opacity-40",
            )}
          >
            <i className="bi bi-plus-circle" />
            Още опция
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!valid || createPoll.isPending}
            className="rounded-[var(--radius-md)] bg-[color:var(--color-primary)] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
          >
            Изпрати анкета
          </button>
        </div>
      </div>
    </motion.div>
  );
}
