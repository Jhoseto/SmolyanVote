"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { EmptyState, LogoLoader } from "@/shared/ui";
import { monitorApi } from "../../api";
import { formatDate, formatEur } from "../../lib/format";
import { MonitorShareButton } from "../MonitorShareButton";
import { MonitorSignalsBadge } from "../MonitorSignalsBadge";
import { RiskBadgeChip } from "../MonitorKpiStrip";
import { RiskFlagList } from "../RiskFlagList";
import type { MonitorContractDetail } from "../../types";

export function MonitorContractDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const invalidId = !Number.isFinite(id);
  const [contract, setContract] = useState<MonitorContractDetail | null>(null);
  const [loading, setLoading] = useState(!invalidId);
  const [error, setError] = useState(invalidId);

  useEffect(() => {
    if (invalidId) return;
    let cancelled = false;
    monitorApi
      .contract(id)
      .then((data) => {
        if (!cancelled) setContract(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, invalidId]);

  if (loading) return <LogoLoader fullScreen label="Зареждане на договор…" />;
  if (error || !contract) {
    return (
      <div className="pt-24">
        <EmptyState icon="bi-file-x" title="Договорът не е намерен" />
      </div>
    );
  }

  return (
    <div className="pb-16 pt-[calc(var(--navbar-height)+1.5rem)]">
      <div className="mx-auto max-w-3xl px-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/monitor/procurement" className="text-[0.85rem] text-primary hover:underline">
            ← Поръчки
          </Link>
          <MonitorShareButton title={contract.subject} />
        </div>
        <header className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <RiskBadgeChip score={contract.riskScore} />
            {contract.euFunded && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[0.68rem] font-medium text-blue-700">
                ЕС финансиране
              </span>
            )}
          </div>
          <h1 className="font-display text-[1.35rem] font-bold leading-snug">{contract.subject}</h1>
          {contract.shortSummary && (
            <p className="text-[0.95rem] text-[color:var(--color-text-secondary)]">{contract.shortSummary}</p>
          )}
          <p className="font-display text-[1.5rem] font-bold text-primary">{formatEur(contract.amountEur)}</p>
        </header>

        <dl className="mt-8 grid gap-3 sm:grid-cols-2">
          <Fact label="Възложител" value={contract.authorityName} />
          <Fact label="Изпълнител" value={contract.contractorName} />
          <Fact label="ЕИК изпълнител" value={contract.contractorEik} />
          <Fact label="Подписан" value={formatDate(contract.signedAt)} />
          <Fact label="Публикувано обявление" value={formatDate(contract.publicationDate)} />
          <Fact label="CPV сектор" value={contract.sectorCode ? `CPV ${contract.sectorCode}` : null} />
          <Fact label="Процедура" value={contract.procedureType} />
          <Fact label="Оферти" value={contract.bidsReceived != null ? String(contract.bidsReceived) : null} />
          <Fact label="Прогнозна стойност" value={contract.estimatedValueEur != null ? formatEur(contract.estimatedValueEur) : null} />
          <Fact
            label="Стойност при подписване"
            value={
              contract.originalAmountEur != null && contract.originalAmountEur !== contract.amountEur
                ? formatEur(contract.originalAmountEur)
                : null
            }
          />
        </dl>

        {contract.riskFlags.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-[0.95rem] font-semibold">Risk flags</h2>
            <div className="mt-2">
              <RiskFlagList flags={contract.riskFlags} />
            </div>
          </section>
        )}

        {contract.amendments?.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-[0.95rem] font-semibold">Анекси / промени в стойността</h2>
            <ul className="mt-3 space-y-2">
              {contract.amendments.map((a) => (
                <li
                  key={a.id}
                  className="rounded-[var(--radius-md)] border border-border-default/30 bg-white/90 px-3 py-2.5 text-[0.85rem]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-[color:var(--color-text-heading)]">
                      {formatDate(a.amendedAt)}
                    </span>
                    {a.deltaEur != null && (
                      <span
                        className={
                          a.deltaEur >= 0 ? "font-semibold text-red-700" : "font-semibold text-emerald-700"
                        }
                      >
                        {a.deltaEur >= 0 ? "+" : ""}
                        {formatEur(a.deltaEur)}
                      </span>
                    )}
                  </div>
                  {(a.previousAmountEur != null || a.newAmountEur != null) && (
                    <p className="mt-1 text-[0.78rem] text-[color:var(--color-text-muted)]">
                      {a.previousAmountEur != null ? formatEur(a.previousAmountEur) : "—"} →{" "}
                      {a.newAmountEur != null ? formatEur(a.newAmountEur) : "—"}
                    </p>
                  )}
                  {a.changeDescription && (
                    <p className="mt-1 text-[color:var(--color-text-secondary)]">{a.changeDescription}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {contract.relatedSignalsCount > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-[0.95rem] font-semibold">Сигнали от граждани</h2>
            <p className="mt-1 text-[0.82rem] text-[color:var(--color-text-muted)]">
              Сигнали в SmolyanVote, свързани по ключови думи с този договор.
            </p>
            <MonitorSignalsBadge
              className="mt-3"
              count={contract.relatedSignalsCount}
              contractId={contract.id}
              signals={contract.relatedSignals}
            />
          </section>
        )}

        {contract.sourceUrl && (
          <a
            href={contract.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[0.9rem] font-medium text-white"
          >
            Виж оригинала в SIGMA ↗
          </a>
        )}
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border-default/30 bg-white/90 px-3 py-2.5">
      <dt className="text-[0.68rem] font-medium uppercase tracking-wide text-[color:var(--color-text-muted)]">
        {label}
      </dt>
      <dd className="mt-0.5 text-[0.9rem] font-medium text-[color:var(--color-text-heading)]">
        {value ?? "—"}
      </dd>
    </div>
  );
}
