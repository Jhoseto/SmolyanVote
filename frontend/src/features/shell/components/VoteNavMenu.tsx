"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/shared/lib/cn";
import { useRequireAuth } from "@/shared/hooks/useRequireAuth";

const CREATE_ITEMS = [
  {
    href: "/event/new",
    icon: "bi-pencil-square",
    title: "Опростен вид",
    description: "Просто гласуване със за / против",
    reason: "да създадеш събитие",
  },
  {
    href: "/referendum/new",
    icon: "bi-file-earmark-plus",
    title: "Референдум",
    description: "Организирайте обществен референдум",
    reason: "да създадеш референдум",
  },
  {
    href: "/multipoll/new",
    icon: "bi-list-check",
    title: "Анкета",
    description: "Множество варианти за избор",
    reason: "да създадеш анкета",
  },
] as const;

const BROWSE_ITEMS = [
  {
    href: "/events?type=event",
    icon: "bi-check2-square",
    title: "Опростени видове",
    description: "Всички прости гласувания",
  },
  {
    href: "/events?type=referendum",
    icon: "bi-ui-checks",
    title: "Референдуми",
    description: "Всички активни референдуми",
  },
  {
    href: "/events?type=poll",
    icon: "bi-bar-chart-steps",
    title: "Анкети",
    description: "Анкети с множествен избор",
  },
] as const;

function MenuRow({
  icon,
  title,
  description,
  tone,
  onClick,
  href,
}: {
  icon: string;
  title: string;
  description: string;
  tone: "create" | "browse";
  onClick?: () => void;
  href?: string;
}) {
  const className = cn(
    "group/row flex w-full items-start gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-left transition-colors",
    "hover:bg-primary-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35",
  );

  const body = (
    <>
      <span
        className={cn(
          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border text-[1.05rem] transition-colors",
          tone === "create"
            ? "border-primary/15 bg-[image:var(--gradient-primary)] text-white shadow-[0_4px_12px_rgba(25,134,28,0.22)]"
            : "border-primary/12 bg-primary-50 text-primary group-hover/row:border-primary/25 group-hover/row:bg-primary-100",
        )}
      >
        <i className={cn("bi", icon)} />
      </span>
      <span className="min-w-0">
        <span className="block font-display text-[0.9rem] font-semibold tracking-[-0.01em] text-[color:var(--color-text-heading)]">
          {title}
        </span>
        <span className="mt-0.5 block text-[0.75rem] leading-snug text-[color:var(--color-text-secondary)]">
          {description}
        </span>
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} className={className}>
        {body}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {body}
    </button>
  );
}

/** Vote mega-menu — create (auth-gated) + browse, glass style matching the shell. */
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

  function handleBrowseNav() {
    setOpen(false);
    onNavigate?.();
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
            "bi bi-chevron-down text-[0.7rem] transition-transform duration-200",
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

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-1/2 top-[calc(100%+12px)] z-[1040] w-[min(94vw,580px)] -translate-x-1/2 overflow-hidden rounded-[var(--radius-lg)] border border-border-default/50 bg-white/95 shadow-[var(--shadow-dropdown)] backdrop-blur-md"
          >
            <div className="grid sm:grid-cols-2">
              <div className="border-b border-border-default/50 p-4 sm:border-b-0 sm:border-r sm:p-5">
                <p className="mb-3 flex items-center gap-2 font-display text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-primary">
                  <i className="bi bi-plus-circle text-[0.95rem]" />
                  Създай събитие
                </p>
                <div className="flex flex-col gap-0.5">
                  {CREATE_ITEMS.map((item) => (
                    <MenuRow
                      key={item.href}
                      tone="create"
                      icon={item.icon}
                      title={item.title}
                      description={item.description}
                      onClick={() => handleCreate(item)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col p-4 sm:p-5">
                <p className="mb-3 flex items-center gap-2 font-display text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-primary">
                  <i className="bi bi-eye text-[0.95rem]" />
                  Прегледай / Гласувай
                </p>
                <div className="flex flex-1 flex-col gap-0.5">
                  {BROWSE_ITEMS.map((item) => (
                    <MenuRow
                      key={item.href}
                      tone="browse"
                      icon={item.icon}
                      title={item.title}
                      description={item.description}
                      href={item.href}
                      onClick={handleBrowseNav}
                    />
                  ))}
                </div>

                <Link
                  href="/events"
                  onClick={handleBrowseNav}
                  className="btn-brand mt-4 inline-flex items-center justify-center gap-2 rounded-[var(--radius-pill)] px-4 py-2.5 text-sm font-semibold shadow-[var(--shadow-md)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]"
                >
                  <i className="bi bi-grid-3x3-gap" />
                  Разгледай всички
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
