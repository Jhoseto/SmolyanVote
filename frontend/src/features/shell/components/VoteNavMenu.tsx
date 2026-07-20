"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/shared/lib/cn";
import { useRequireAuth } from "@/shared/hooks/useRequireAuth";

const CREATE_ITEMS = [
  {
    href: "/event/new",
    icon: "bi-pencil-square",
    title: "Опростен вид",
    description: "Създайте просто гласуване с да/не варианти",
    reason: "да създадеш събитие",
  },
  {
    href: "/referendum/new",
    icon: "bi-file-earmark-plus",
    title: "Референдум",
    description: "Организирайте вашия референдум",
    reason: "да създадеш референдум",
  },
  {
    href: "/multipoll/new",
    icon: "bi-list-check",
    title: "Анкета с множествен избор",
    description: "Създайте анкета с множество варианти",
    reason: "да създадеш анкета",
  },
] as const;

const BROWSE_ITEMS = [
  {
    href: "/events?type=event",
    icon: "bi-check2-square",
    title: "Опростени видове",
    description: "Вижте всички опростени гласувания",
  },
  {
    href: "/events?type=referendum",
    icon: "bi-ui-checks",
    title: "Референдуми",
    description: "Прегледайте всички референдуми",
  },
  {
    href: "/events?type=poll",
    icon: "bi-bar-chart-steps",
    title: "Анкети с множествен избор",
    description: "Вижте всички анкети и въпроси",
  },
  {
    href: "/events",
    icon: "bi-grid-3x3-gap",
    title: "Разгледай всички",
    description: "Общ преглед на всички събития",
    highlight: true,
  },
] as const;

/** v1 Vote mega-menu — create (auth-gated) + browse sections. */
export function VoteNavMenu({
  label,
  onNavigate,
  className,
}: {
  label: string;
  onNavigate?: () => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const requireAuth = useRequireAuth();

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  async function handleCreate(item: (typeof CREATE_ITEMS)[number]) {
    setOpen(false);
    onNavigate?.();
    if (!(await requireAuth(item.reason))) return;
    router.push(item.href);
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "group relative flex items-center gap-1.5 px-3 py-2 text-[0.8rem] font-light tracking-[0.3px] text-[color:var(--color-text-nav)] transition-colors hover:text-primary",
          open && "text-primary",
        )}
      >
        <i className="bi bi-hand-index-thumb text-[1.1rem]" />
        <span>{label}</span>
        <i
          className={cn(
            "bi bi-chevron-down text-[0.7rem] transition-transform",
            open && "rotate-180",
          )}
        />
        <span
          className={cn(
            "absolute -bottom-0.5 left-1/2 h-0.5 -translate-x-1/2 rounded-full bg-[image:var(--gradient-primary)] transition-all duration-300",
            open ? "w-[70%]" : "w-0 group-hover:w-[70%]",
          )}
        />
      </button>

      {open && (
        <div className="absolute left-1/2 top-[calc(100%+10px)] z-[1040] w-[min(92vw,560px)] -translate-x-1/2 rounded-[12px] border border-white/40 bg-white/95 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur-md">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h5 className="mb-2 flex items-center gap-2 text-sm font-semibold text-[color:var(--color-text-heading)]">
                <i className="bi bi-plus-circle text-primary" />
                Създай събитие
              </h5>
              <div className="flex flex-col gap-1">
                {CREATE_ITEMS.map((item) => (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => handleCreate(item)}
                    className="flex items-start gap-3 rounded-[8px] px-3 py-2.5 text-left transition-colors hover:bg-primary-50"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[image:var(--gradient-primary)] text-white">
                      <i className={cn("bi", item.icon)} />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-[color:var(--color-text-heading)]">
                        {item.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-[color:var(--color-text-muted)]">
                        {item.description}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h5 className="mb-2 flex items-center gap-2 text-sm font-semibold text-[color:var(--color-text-heading)]">
                <i className="bi bi-eye text-[#3b82f6]" />
                Прегледай / Гласувай
              </h5>
              <div className="flex flex-col gap-1">
                {BROWSE_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      setOpen(false);
                      onNavigate?.();
                    }}
                    className={cn(
                      "flex items-start gap-3 rounded-[8px] px-3 py-2.5 transition-colors hover:bg-primary-50",
                      "highlight" in item && item.highlight && "bg-primary-50/70",
                    )}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[color:var(--color-surface-muted)] text-primary">
                      <i className={cn("bi", item.icon)} />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-[color:var(--color-text-heading)]">
                        {item.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-[color:var(--color-text-muted)]">
                        {item.description}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
