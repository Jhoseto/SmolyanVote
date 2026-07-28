"use client";

import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/cn";

const STORAGE_KEY = "sv:signals-info-dismissed";

interface SignalsInfoPanelProps {
  className?: string;
}

/** Explains what signals are, how to submit, boost priority, and why it matters. */
export function SignalsInfoPanel({ className }: SignalsInfoPanelProps) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(false);

  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      setOpen(true);
      setHighlight(true);
      const t = setTimeout(() => setHighlight(false), 2400);
      return () => clearTimeout(t);
    }
  }, []);

  function dismiss() {
    setOpen(false);
    localStorage.setItem(STORAGE_KEY, "1");
  }

  return (
    <div className={cn("overflow-hidden rounded-[var(--radius-xl)] border border-primary/15 bg-gradient-to-br from-primary-50/70 via-white to-white shadow-[0_4px_24px_rgba(13,110,253,0.06)]", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-primary-50/40",
          highlight && "ring-2 ring-primary/30 ring-offset-2",
        )}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-[color:var(--color-text-heading)]">
          <i className="bi bi-info-circle text-primary" />
          Как работят гражданските сигнали?
        </span>
        <i className={cn("bi text-[color:var(--color-text-muted)] transition-transform", open ? "bi-chevron-up" : "bi-chevron-down")} />
      </button>

      {open && (
        <div className="space-y-4 border-t border-primary/10 px-4 pb-4 pt-3 text-sm text-[color:var(--color-text-secondary)]">
          <section>
            <h3 className="mb-1 font-semibold text-[color:var(--color-text-heading)]">Какво е това?</h3>
            <p>
              Тук подавате сигнал за проблем в Смолян — счупен тротоар, липсващо осветление, незаконно
              паркиране и др. Сигналът се показва на картата и става видим за всички съграждани.
            </p>
          </section>

          <section>
            <h3 className="mb-1 font-semibold text-[color:var(--color-text-heading)]">Защо е важно?</h3>
            <p>
              Колективният глас привлича внимание към реални проблеми. Колкото повече хора подкрепят един
              сигнал, толкова по-висок става неговият приоритет — така най-спешните казуси излизат на
              преден план.
            </p>
          </section>

          <section>
            <h3 className="mb-1 font-semibold text-[color:var(--color-text-heading)]">Как да подадеш сигнал</h3>
            <ol className="list-decimal space-y-1 pl-5">
              <li>Натисни „Подай сигнал“ и позволи достъп до локацията си (или избери точка на картата).</li>
              <li>Добави ясно заглавие, описание и категория.</li>
              <li>Прикачи снимка — силно помага за идентификация на проблема.</li>
            </ol>
          </section>

          <section>
            <h3 className="mb-1 font-semibold text-[color:var(--color-text-heading)]">Вдигане на приоритет</h3>
            <p>
              Вместо „харесване“, можеш да <strong>вдигнеш приоритета</strong> на сигнал, който смяташ за
              важен. Всеки сигнал има 3 нива — ниско, средно и високо — изчислени{" "}
              <strong>спрямо другите активни сигнали от същата категория</strong>. Така сравнението е
              справедливо: проблем с осветлението се мери срещу други проблеми с осветление, не срещу
              напълно различни категории.
            </p>
          </section>

          <section>
            <h3 className="mb-1 font-semibold text-[color:var(--color-text-heading)]">Карта и списък</h3>
            <p>
              Картата и лентите със сигнали са на една страница — скролирай надолу за пълния списък или използвай бързата навигация
              отгоре. Докосни маркер или карта, за да видиш детайли. Сподели линка, за да ангажираш съседи.
            </p>
          </section>

          <section>
            <h3 className="mb-1 font-semibold text-[color:var(--color-text-heading)]">Съвети за телефон</h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>Използвай GPS на открито за по-точна локация.</li>
              <li>Снимай проблема отблизо и отдалечено.</li>
              <li>Провери дали точката е в границите на област Смолян.</li>
            </ul>
          </section>

          <button
            type="button"
            onClick={dismiss}
            className="text-xs font-medium text-primary hover:underline"
          >
            Разбрах, не показвай автоматично
          </button>
        </div>
      )}
    </div>
  );
}
