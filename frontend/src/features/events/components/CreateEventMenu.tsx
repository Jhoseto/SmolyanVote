"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui";
import { useRequireAuth } from "@/shared/hooks/useRequireAuth";
import { cn } from "@/shared/lib/cn";

const OPTIONS: { href: string; label: string; icon: string; reason: string }[] = [
  { href: "/event/new", label: "Събитие", icon: "bi-calendar-event", reason: "да създадеш събитие" },
  { href: "/referendum/new", label: "Референдум", icon: "bi-check2-square", reason: "да създадеш референдум" },
  { href: "/multipoll/new", label: "Анкета", icon: "bi-bar-chart-steps", reason: "да създадеш анкета" },
];

/** "Създай" dropdown on the events hub — login-gated navigation to the 3 create forms. */
export function CreateEventMenu() {
  const router = useRouter();
  const requireAuth = useRequireAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, []);

  async function handleSelect(option: (typeof OPTIONS)[number]) {
    setOpen(false);
    if (!(await requireAuth(option.reason))) return;
    router.push(option.href);
  }

  return (
    <div ref={ref} className="relative">
      <Button type="button" onClick={() => setOpen((v) => !v)}>
        <i className="bi bi-plus-lg" />
        Създай
        <i className={cn("bi bi-chevron-down text-xs transition-transform", open && "rotate-180")} />
      </Button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[200px] overflow-hidden rounded-[var(--radius-md)] border border-border-default/60 bg-white/95 py-2 shadow-[var(--shadow-dropdown)] backdrop-blur-md">
          {OPTIONS.map((option) => (
            <button
              key={option.href}
              type="button"
              onClick={() => handleSelect(option)}
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-[color:var(--color-text-primary)] transition-colors hover:bg-primary-50"
            >
              <i className={cn("bi", option.icon, "text-[1rem]")} />
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
