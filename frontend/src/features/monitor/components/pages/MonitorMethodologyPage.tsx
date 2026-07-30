"use client";

import { useState } from "react";
import { cn } from "@/shared/lib/cn";
import { useMonitorOverview } from "../../hooks/useMonitorOverview";
import { MonitorMobileShell } from "../MonitorMobileShell";

const FLAGS = [
  { code: "SINGLE_BID", label: "Единствена оферта", desc: "Само една оферта е получена при процедурата." },
  { code: "LARGE_SINGLE_BID", label: "Голям договор, един оферент", desc: "Договор над 100k EUR с единствен оферент." },
  { code: "ABOVE_TYPICAL", label: "Над типичното", desc: "Стойност ≥ 5× медианата за същия CPV сектор в региона." },
  { code: "REPEAT_WINNER", label: "Повтарящ се победител", desc: "Фирмата печели >50% от договорите в сектора при регионални възложители." },
  { code: "EU_LOW_COMPETITION", label: "ЕС + ниска конкуренция", desc: "ЕС финансиране с ≤1 оферта." },
  { code: "FRAGMENTATION", label: "Раздробяване", desc: "≥3 договора под прага за една фирма и CPV за 90 дни." },
  { code: "ABOVE_ESTIMATE", label: "Над прогнозата", desc: "Подписана стойност ≥ 10% над прогнозната от обявлението (данни от ЦАИС ЕОП)." },
  { code: "AMENDMENT_GROWTH", label: "Ръст чрез анекси", desc: "Стойността е нараснала с ≥ 20% чрез анекси спрямо подписването." },
  { code: "NEW_COMPANY_LARGE_CONTRACT", label: "Ново дружество, голяма поръчка", desc: "Фирмата е регистрирана до 6 месеца преди подписването на договор над 100k EUR." },
  { code: "SIGNED_BEFORE_PUBLICATION", label: "Подписан преди публикуване", desc: "Датата на подписване предхожда датата на публикуване на обявлението." },
];

function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-[var(--radius-lg)] border border-border-default/35 bg-white/95">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <h2 className="font-display text-[1rem] font-semibold text-[color:var(--color-text-heading)]">
          {title}
        </h2>
        <i className={cn("bi text-primary transition", open ? "bi-chevron-up" : "bi-chevron-down")} />
      </button>
      {open && <div className="border-t border-border-default/25 px-5 pb-5 pt-2">{children}</div>}
    </section>
  );
}

export function MonitorMethodologyPage() {
  const { overview, loading } = useMonitorOverview();

  return (
    <MonitorMobileShell overview={overview} overviewLoading={loading} title="Методология" showKpi={false}>
      <div className="prose-sm max-w-3xl space-y-4 text-[color:var(--color-text-secondary)]">
        <CollapsibleSection title="Обхват" defaultOpen>
          <p className="text-[0.9rem]">
            Гражданският монитор показва само данни за <strong>Община Смолян и област Смолян</strong> (8
            общини). Няма национални класации. Import от SIGMA филтрира по whitelist на ЕИК.
          </p>
        </CollapsibleSection>

        <CollapsibleSection title="Risk score (0–100)">
          <p className="text-[0.9rem]">
            Всяко правило добавя тегло. Сумата се ограничава до 100. Публично се показват договори с score ≥
            40. CRI (Composite Risk Index) за фирми е средно претеглено по стойност на договорите.
          </p>
          <ul className="mt-4 space-y-3">
            {FLAGS.map((f) => (
              <li
                key={f.code}
                className="flex gap-3 rounded-[var(--radius-md)] bg-[color:var(--color-surface-muted)] p-3"
              >
                <i className="bi bi-shield-exclamation mt-0.5 text-primary" />
                <div>
                  <p className="font-medium text-[color:var(--color-text-heading)]">{f.label}</p>
                  <p className="text-[0.85rem]">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[0.78rem] text-[color:var(--color-text-muted)]">
            „Над прогнозата" и „Подписан преди публикуване" изискват прогнозна стойност и дата на
            обявлението — налични само за договори от ЦАИС ЕОП. Договорите, внесени само от SIGMA, не
            получават тези два флага.
          </p>
        </CollapsibleSection>

        <CollapsibleSection title="Източници">
          <ul className="list-inside list-disc text-[0.9rem]">
            <li>SIGMA (sigma.midt.bg) — договори по authority_eik за 8-те общини</li>
            <li>storage.eop.bg — fallback договори и анекси (EOP open data)</li>
            <li>smolyan.bg — решения, протоколи, обсъждания (admin scraper)</li>
            <li>Търговски регистър — enrichment на фирми (admin)</li>
            <li>SmolyanVote Сигнали — кръстосана проверка по ключови думи</li>
          </ul>
        </CollapsibleSection>

        <CollapsibleSection title="Какво НЕ е обвинение">
          <p className="text-[0.9rem]">
            Risk flags са автоматични сигнали за внимание, не правни заключения. Всяко твърдение има линк към
            първоизточник. AI резюметата са интерпретация, не официален документ.
          </p>
        </CollapsibleSection>
      </div>
    </MonitorMobileShell>
  );
}
