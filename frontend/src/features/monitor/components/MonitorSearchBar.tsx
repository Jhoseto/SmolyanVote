"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/shared/lib/cn";
import { monitorApi } from "../api";
import type { MonitorSearchSuggestion } from "../types";
import { useMonitorAuthority } from "./MonitorAuthorityProvider";

interface MonitorSearchBarProps {
  className?: string;
  placeholder?: string;
}

export function MonitorSearchBar({
  className,
  placeholder = "Търси поръчки, фирми, документи…",
}: MonitorSearchBarProps) {
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<MonitorSearchSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { authority, withAuthority } = useMonitorAuthority();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const fetchSuggest = useCallback(
    (term: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (term.trim().length < 2) {
        setSuggestions([]);
        setOpen(false);
        return;
      }
      debounceRef.current = setTimeout(() => {
        setLoading(true);
        monitorApi
          .searchSuggest(term.trim(), 8, authority)
          .then((items) => {
            setSuggestions(items);
            setOpen(items.length > 0);
          })
          .finally(() => setLoading(false));
      }, 280);
    },
    [authority],
  );

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    setOpen(false);
    router.push(withAuthority(`/monitor/search?q=${encodeURIComponent(trimmed)}`));
  }

  function pick(s: MonitorSearchSuggestion) {
    setOpen(false);
    const href =
      s.itemType === "contract" ? `/monitor/contract/${s.id}` : `/monitor/document/${s.id}`;
    router.push(withAuthority(href));
  }

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <form onSubmit={submit}>
        <i className="bi bi-search pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-[color:var(--color-text-muted)]" />
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            fetchSuggest(e.target.value);
          }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full rounded-full border border-border-default/40 bg-white/95 py-2.5 pl-10 pr-4 text-[0.9rem] shadow-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
        />
      </form>
      {open && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-[var(--radius-lg)] border border-border-default/40 bg-white py-1 shadow-lg">
          {loading && (
            <li className="px-3 py-2 text-[0.8rem] text-[color:var(--color-text-muted)]">…</li>
          )}
          {suggestions.map((s) => (
            <li key={`${s.itemType}-${s.id}`}>
              <button
                type="button"
                onClick={() => pick(s)}
                className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-primary-50/60"
              >
                <span className="text-[0.82rem] font-medium text-[color:var(--color-text-heading)]">
                  {s.title}
                </span>
                {s.subtitle && (
                  <span className="text-[0.72rem] text-[color:var(--color-text-muted)]">
                    {s.itemType === "contract" ? "Поръчка" : "Документ"} · {s.subtitle}
                  </span>
                )}
              </button>
            </li>
          ))}
          <li className="border-t border-border-default/30 px-3 py-2">
            <button
              type="button"
              onClick={() => submit()}
              className="text-[0.78rem] font-medium text-primary hover:underline"
            >
              Виж всички резултати за „{q.trim()}“ →
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
