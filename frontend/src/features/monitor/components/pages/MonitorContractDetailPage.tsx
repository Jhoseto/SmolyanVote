"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { EmptyState, LogoLoader } from "@/shared/ui";
import { monitorApi } from "../../api";
import { cpvLabel } from "../../data/cpv-sectors";
import { formatDate, formatEur } from "../../lib/format";
import {
  contractorKindLabel,
  dataSourceLabel,
  formatInstant,
  regionScopeLabel,
  yesNo,
} from "../../lib/contractLabels";
import { MonitorShareButton } from "../MonitorShareButton";
import { MonitorSignalsBadge } from "../MonitorSignalsBadge";
import { RiskBadgeChip } from "../MonitorKpiStrip";
import { RiskFlagList } from "../RiskFlagList";
import { useMonitorAuthority } from "../MonitorAuthorityProvider";
import type { MonitorContractDetail } from "../../types";

export function MonitorContractDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const invalidId = !Number.isFinite(id);
  const { withAuthority } = useMonitorAuthority();
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

  const amountGrowth =
    contract.originalAmountEur != null &&
    contract.amountEur != null &&
    contract.originalAmountEur !== contract.amountEur
      ? contract.amountEur - contract.originalAmountEur
      : null;

  return (
    <div className="pb-16 pt-[calc(var(--navbar-height)+1.5rem)]">
      <div className="mx-auto max-w-3xl px-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href={withAuthority("/monitor/procurement")} className="text-[0.85rem] text-primary hover:underline">
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
            {contract.bidsReceived === 1 && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[0.68rem] font-medium text-amber-800">
                Единствена оферта
              </span>
            )}
          </div>
          <h1 className="font-display text-[1.35rem] font-bold leading-snug">
            {contract.insightHeadline ?? contract.subject}
          </h1>
          {(contract.whyItMatters || (contract.shortSummary && contract.shortSummary !== contract.subject)) && (
            <div className="rounded-[var(--radius-md)] border border-amber-200/50 bg-amber-50/60 px-4 py-3">
              <p className="text-[0.72rem] font-semibold uppercase tracking-wide text-amber-900">
                Защо е важно
              </p>
              <p className="mt-1 text-[0.92rem] leading-relaxed text-[color:var(--color-text-secondary)]">
                {contract.whyItMatters ?? contract.shortSummary}
              </p>
            </div>
          )}
          {contract.aiAnalysis && (
            <div className="rounded-[var(--radius-md)] border border-primary/25 bg-primary-50/50 px-4 py-4">
              <p className="text-[0.72rem] font-semibold uppercase tracking-wide text-primary">
                SMOLYANVOTE Анализ за данъкоплатеца
              </p>
              <p className="mt-2 whitespace-pre-line text-[0.9rem] leading-relaxed text-[color:var(--color-text-secondary)]">
                {contract.aiAnalysis}
              </p>
            </div>
          )}
          {contract.insightHeadline && contract.insightHeadline !== contract.subject && (
            <p className="text-[0.78rem] text-[color:var(--color-text-muted)]">
              Официален предмет: {contract.subject}
            </p>
          )}
          <p className="font-display text-[1.5rem] font-bold text-primary">{formatEur(contract.amountEur)}</p>
          {amountGrowth != null && amountGrowth !== 0 && (
            <p className="text-[0.82rem] text-[color:var(--color-text-muted)]">
              Промяна спрямо първоначалната стойност:{" "}
              <span className={amountGrowth > 0 ? "font-semibold text-red-700" : "font-semibold text-emerald-700"}>
                {amountGrowth > 0 ? "+" : ""}
                {formatEur(amountGrowth)}
              </span>
            </p>
          )}
        </header>

        <DetailSection title="Идентификация">
          <FactGrid>
            <Fact label="УНП (уникален номер на процедура)" value={contract.unp} />
            <Fact label="Регионален обхват" value={regionScopeLabel(contract.regionScope)} />
            <Fact label="Източник на данните" value={dataSourceLabel(contract.dataSource)} />
            <Fact label="Последно обновяване" value={formatInstant(contract.fetchedAt)} />
          </FactGrid>
        </DetailSection>

        <DetailSection title="Възложител">
          <FactGrid>
            <Fact label="Наименование" value={contract.authorityName} />
            <Fact label="ЕИК" value={contract.authorityEik} />
          </FactGrid>
        </DetailSection>

        <DetailSection title="Изпълнител">
          <FactGrid>
            <Fact
              label="Наименование"
              value={contract.contractorName}
              href={
                contract.contractorEik
                  ? withAuthority(`/monitor/company/${contract.contractorEik}`)
                  : undefined
              }
            />
            <Fact label="ЕИК" value={contract.contractorEik} />
            <Fact label="Вид изпълнител" value={contractorKindLabel(contract.contractorKind)} />
          </FactGrid>
        </DetailSection>

        {contract.hasSubcontractors && (
          <DetailSection title="Подизпълнител (EOP)">
            <p className="mb-3 text-[0.78rem] text-[color:var(--color-text-muted)]">
              Деклариран директен подизпълнител — отворените данни не показват по-дълбока верига.
            </p>
            <FactGrid>
              <Fact
                label="Наименование"
                value={contract.subcontractorName}
                href={
                  contract.subcontractorEik
                    ? withAuthority(`/monitor/company/${contract.subcontractorEik}`)
                    : undefined
                }
              />
              <Fact label="ЕИК" value={contract.subcontractorEik} />
              <Fact
                label="Дял от договора"
                value={
                  contract.subcontractingPercent != null
                    ? `${contract.subcontractingPercent}%`
                    : null
                }
              />
              <Fact
                label="Стойност на подизпълнение (EUR)"
                value={formatEur(contract.subcontractingAmountEur)}
                highlight
              />
            </FactGrid>
          </DetailSection>
        )}

        <DetailSection title="Процедура и класификация">
          <FactGrid>
            <Fact label="Вид процедура" value={contract.procedureType} />
            <Fact label="CPV сектор" value={cpvLabel(contract.sectorCode)} />
            <Fact label="Получени оферти" value={contract.bidsReceived != null ? String(contract.bidsReceived) : null} />
            <Fact label="ЕС финансиране" value={yesNo(contract.euFunded)} />
            {contract.aiCategory && <Fact label="AI категория" value={contract.aiCategory} />}
          </FactGrid>
        </DetailSection>

        <DetailSection title="Стойности и срокове">
          <FactGrid>
            <Fact label="Текуща стойност (EUR)" value={formatEur(contract.amountEur)} highlight />
            <Fact label="Стойност при подписване (EUR)" value={formatEur(contract.originalAmountEur)} />
            <Fact label="Прогнозна стойност от обявление (EUR)" value={formatEur(contract.estimatedValueEur)} />
            <Fact label="Дата на подписване" value={formatDate(contract.signedAt)} />
            <Fact label="Дата на публикуване на обявлението" value={formatDate(contract.publicationDate)} />
            {contract.impactScore != null && (
              <Fact label="Impact score (седмичен feed)" value={String(contract.impactScore)} />
            )}
          </FactGrid>
        </DetailSection>

        {contract.riskFlags.length > 0 && (
          <DetailSection title="Рискови индикатори">
            <RiskFlagList flags={contract.riskFlags} />
          </DetailSection>
        )}

        {contract.amendments?.length > 0 && (
          <DetailSection title="Анекси и промени в стойността">
            <ul className="space-y-2">
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
                  {a.changeReason && (
                    <p className="mt-1 text-[0.78rem] italic text-[color:var(--color-text-muted)]">
                      {a.changeReason}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </DetailSection>
        )}

        {contract.relatedSignalsCount > 0 && (
          <DetailSection title="Сигнали от граждани">
            <p className="mb-3 text-[0.82rem] text-[color:var(--color-text-muted)]">
              Сигнали в SmolyanVote, свързани по ключови думи с този договор.
            </p>
            <MonitorSignalsBadge
              count={contract.relatedSignalsCount}
              contractId={contract.id}
              signals={contract.relatedSignals}
            />
          </DetailSection>
        )}
      </div>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 font-display text-[0.95rem] font-semibold text-[color:var(--color-text-heading)]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function FactGrid({ children }: { children: React.ReactNode }) {
  return <dl className="grid gap-3 sm:grid-cols-2">{children}</dl>;
}

function Fact({
  label,
  value,
  highlight,
  href,
}: {
  label: string;
  value: string | null | undefined;
  highlight?: boolean;
  href?: string;
}) {
  const display = value ?? "—";
  return (
    <div className="rounded-[var(--radius-md)] border border-border-default/30 bg-white/90 px-3 py-2.5">
      <dt className="text-[0.68rem] font-medium uppercase tracking-wide text-[color:var(--color-text-muted)]">
        {label}
      </dt>
      <dd
        className={
          highlight
            ? "mt-0.5 font-display text-[1.05rem] font-bold text-primary"
            : "mt-0.5 text-[0.9rem] font-medium text-[color:var(--color-text-heading)]"
        }
      >
        {href && value ? (
          <Link href={href} className="text-primary hover:underline">
            {display}
          </Link>
        ) : (
          display
        )}
      </dd>
    </div>
  );
}
