"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { cn } from "@/shared/lib/cn";
import { useToast } from "@/shared/hooks/useToast";
import { errorMessage } from "@/shared/lib/errorMessage";
import { adminMonitorApi } from "../../api/monitorAdmin";
import { ActionButton } from "./MonitorIngestionTab";

export function MonitorDataQualityPanel({ enabled }: { enabled: boolean }) {
  const toast = useToast();

  const reportQ = useQuery({
    queryKey: ["admin", "monitor", "integrity-report"],
    queryFn: () => adminMonitorApi.dataQualityReport(),
    enabled,
  });

  const spotCheckMut = useMutation({
    mutationFn: () => adminMonitorApi.sigmaSpotCheck(25),
    onSuccess: (data) => {
      if (data.mismatched > 0 || data.notInSigma > 0) {
        toast.warning(data.message);
      } else {
        toast.success(data.message);
      }
    },
    onError: (e) => toast.error(errorMessage(e, "Spot-check неуспешен")),
  });

  const repairMut = useMutation({
    mutationFn: () => adminMonitorApi.repairIntegrity(),
    onSuccess: () => {
      toast.info("Integrity repair стартира във фонов режим");
      void reportQ.refetch();
    },
    onError: (e) => toast.error(errorMessage(e, "Repair не стартира")),
  });

  const report = reportQ.data;
  const spot = spotCheckMut.data;

  return (
    <section className="rounded-[var(--radius-lg)] border border-border-default/35 bg-white/95 p-5">
      <h2 className="font-display text-[1.05rem] font-semibold">Качество на данните</h2>
      <p className="mt-1 text-[0.85rem] text-[color:var(--color-text-secondary)]">
        Проверка на валути, дати и съответствие с live SIGMA — за да не подвеждаме гражданите.
      </p>

      {reportQ.isLoading && (
        <p className="mt-4 text-[0.85rem] text-[color:var(--color-text-muted)]">Зареждане…</p>
      )}

      {report && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MiniStat label="Договори" value={String(report.contractsTotal)} />
          <MiniStat label="Без signed_at" value={String(report.missingSignedAt)} warn={report.missingSignedAt > 0} />
          <MiniStat label="Валутни предупр." value={String(report.currencyWarnings)} warn={report.currencyWarnings > 0} />
          <MiniStat
            label="Документи без валута"
            value={String(report.documentsWithAmountMissingCurrency)}
            warn={report.documentsWithAmountMissingCurrency > 0}
          />
        </div>
      )}

      {report && report.alerts.length > 0 && (
        <ul className="mt-4 space-y-1 text-[0.82rem] text-amber-800">
          {report.alerts.map((a) => (
            <li key={a}>⚠ {a}</li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <ActionButton
          icon="bi-shield-check"
          label="SIGMA spot-check"
          description="25 договора vs live CSV"
          onClick={() => spotCheckMut.mutate()}
          loading={spotCheckMut.isPending}
        />
        <ActionButton
          icon="bi-wrench"
          label="Integrity repair"
          description="UNP дати + валути backfill"
          onClick={() => repairMut.mutate()}
          loading={repairMut.isPending}
        />
        <ActionButton
          icon="bi-arrow-clockwise"
          label="Обнови отчет"
          description="Презареди метриките"
          onClick={() => void reportQ.refetch()}
        />
      </div>

      {spot && spot.rows.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-[var(--radius-md)] border border-border-default/30">
          <table className="w-full min-w-[520px] text-left text-[0.8rem]">
            <thead className="bg-[color:var(--color-surface-muted)] text-[0.72rem] uppercase tracking-wide">
              <tr>
                <th className="px-3 py-2">Sigma ID</th>
                <th className="px-3 py-2">Локално €</th>
                <th className="px-3 py-2">SIGMA €</th>
                <th className="px-3 py-2">Статус</th>
              </tr>
            </thead>
            <tbody>
              {spot.rows.slice(0, 15).map((row) => (
                <tr key={row.sigmaId} className="border-t border-border-default/20">
                  <td className="px-3 py-2 font-mono text-[0.75rem]">{row.sigmaId}</td>
                  <td className="px-3 py-2 tabular-nums">{row.localAmountEur ?? "—"}</td>
                  <td className="px-3 py-2 tabular-nums">{row.sigmaAmountEur ?? "—"}</td>
                  <td className={cn("px-3 py-2", row.match ? "text-emerald-700" : "text-red-700")}>
                    {row.note}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-border-default/20 px-3 py-2 text-[0.75rem] text-[color:var(--color-text-muted)]">
            {spot.message}
          </p>
        </div>
      )}
    </section>
  );
}

function MiniStat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border px-3 py-2.5",
        warn ? "border-amber-200 bg-amber-50/60" : "border-border-default/30",
      )}
    >
      <p className="text-[0.68rem] uppercase tracking-wide text-[color:var(--color-text-muted)]">{label}</p>
      <p className="mt-0.5 font-semibold tabular-nums">{value}</p>
    </div>
  );
}
