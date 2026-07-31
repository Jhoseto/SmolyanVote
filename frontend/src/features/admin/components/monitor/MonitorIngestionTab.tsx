"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ErrorState, Skeleton } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useToast } from "@/shared/hooks/useToast";
import { errorMessage } from "@/shared/lib/errorMessage";
import { adminMonitorApi } from "../../api/monitorAdmin";
import type { MonitorJobState } from "../../types";

const isJobActive = (job?: MonitorJobState) =>
  job?.status === "QUEUED" || job?.status === "RUNNING";

export function MonitorIngestionTab({ enabled }: { enabled: boolean }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [aiBatchLimit, setAiBatchLimit] = useState(30);

  const statusQ = useQuery({
    queryKey: ["admin", "monitor", "status"],
    queryFn: () => adminMonitorApi.ingestionStatus(),
    enabled,
  });

  const logsQ = useQuery({
    queryKey: ["admin", "monitor", "logs"],
    queryFn: () => adminMonitorApi.ingestionLogs(25),
    enabled,
  });

  const aiStatsQ = useQuery({
    queryKey: ["admin", "monitor", "ai-stats"],
    queryFn: () => adminMonitorApi.aiStats(),
    enabled,
  });

  // A SIGMA import runs for minutes on the server. Poll while anything is in flight.
  const jobsQ = useQuery({
    queryKey: ["admin", "monitor", "jobs"],
    queryFn: () => adminMonitorApi.ingestionJobs(),
    enabled,
    refetchInterval: (query) => (query.state.data?.some(isJobActive) ? 2500 : false),
  });

  const jobs = jobsQ.data ?? [];
  const jobFor = (key: string) => jobs.find((job) => job.key === key);

  const refreshData = useCallback(() => {
    for (const key of ["status", "logs", "ai-stats"]) {
      void queryClient.invalidateQueries({ queryKey: ["admin", "monitor", key] });
    }
  }, [queryClient]);

  // Announce each job exactly once, when it leaves the queue and settles.
  const lastStatus = useRef<Record<string, string>>({});
  useEffect(() => {
    if (!jobsQ.data) return;
    let settled = false;
    for (const job of jobsQ.data) {
      const previous = lastStatus.current[job.key];
      lastStatus.current[job.key] = job.status;
      if (!previous || previous === job.status) continue;
      if (job.status === "SUCCESS") {
        toast.success(job.message ?? `${job.label} завърши`);
        settled = true;
      } else if (job.status === "FAILED") {
        toast.error(job.message ?? `${job.label} е неуспешен`);
        settled = true;
      }
    }
    if (settled) refreshData();
  }, [jobsQ.data, toast, refreshData]);

  const launchMut = useMutation({
    mutationFn: (job: { start: () => Promise<MonitorJobState> }) => job.start(),
    onSuccess: (state) => {
      lastStatus.current[state.key] = state.status;
      if (state.status === "BUSY") {
        toast.warning(state.message ?? `${state.label} вече се изпълнява`);
      } else {
        toast.info(state.message ?? `${state.label} стартира във фонов режим`);
      }
      void jobsQ.refetch();
    },
    onError: (e) => toast.error(errorMessage(e, "Задачата не стартира")),
  });

  const start = useCallback(
    (startFn: () => Promise<MonitorJobState>) => launchMut.mutate({ start: startFn }),
    [launchMut],
  );

  function retryIngestion(ingestionType: string) {
    const t = ingestionType.toUpperCase();
    if (t.includes("SIGMA")) {
      start(() => adminMonitorApi.triggerSigma());
    } else if (t.includes("EOP")) {
      start(() => adminMonitorApi.triggerEop(7));
    } else if (t.includes("SMOLYAN") || t.includes("SCRAPE")) {
      start(() => adminMonitorApi.triggerScrape());
    } else {
      toast.error(`Няма retry за тип ${ingestionType}`);
    }
  }

  const busy = launchMut.isPending;

  if (statusQ.isLoading) {
    return <Skeleton className="h-96 w-full rounded-[var(--radius-lg)]" />;
  }
  if (statusQ.isError) {
    return (
      <ErrorState description="Монитор панелът не се зареди" onRetry={() => statusQ.refetch()} />
    );
  }

  const status = statusQ.data!;

  return (
    <div className="space-y-8">
      {/* KPI */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          title="SIGMA"
          value={status.sigmaStatus}
          detail={
            status.sigmaLastRun
              ? `${fmtDate(status.sigmaLastRun)} · ${status.sigmaRecordsProcessed ?? 0} записа`
              : "Никога не е пускан"
          }
          tone={statusTone(status.sigmaStatus)}
        />
        <StatCard
          title="EOP"
          value={status.eopStatus}
          detail={
            status.eopLastRun
              ? `${fmtDate(status.eopLastRun)} · ${status.eopRecordsProcessed ?? 0} записа`
              : "storage.eop.bg fallback"
          }
          tone={statusTone(status.eopStatus)}
        />
        <StatCard
          title="smolyan.bg scraper"
          value={status.scrapeStatus}
          detail={
            status.scrapeLastRun
              ? fmtDate(status.scrapeLastRun)
              : "Стартирайте sidecar: cd scraper && npm start"
          }
          tone={statusTone(status.scrapeStatus)}
        />
        <StatCard title="Договори" value={String(status.contractCount)} detail="Област Смолян" />
        <StatCard title="Документи" value={String(status.documentCount)} detail="От scraper" />
      </div>

      {/* AI status */}
      {aiStatsQ.data && (
        <div
          className={cn(
            "flex flex-wrap items-center gap-3 rounded-[var(--radius-lg)] border px-4 py-3 text-[0.85rem]",
            aiStatsQ.data.geminiConfigured
              ? "border-emerald-200 bg-emerald-50/80 text-emerald-900"
              : "border-amber-200 bg-amber-50/80 text-amber-900",
          )}
        >
          <i className={cn("bi", aiStatsQ.data.geminiConfigured ? "bi-check-circle" : "bi-exclamation-triangle")} />
          <span>
            Gemini: {aiStatsQ.data.geminiConfigured ? "конфигуриран" : "липсва GEMINI_API_KEY — без пълен AI доклад"}
            {aiStatsQ.data.geminiConfigured && (
              <span className="text-[color:var(--color-text-muted)]"> · модел {aiStatsQ.data.geminiModel}</span>
            )}
          </span>
          <span className="text-[color:var(--color-text-muted)]">·</span>
          <span>
            <strong>{aiStatsQ.data.pendingDocuments}</strong> документа
            · <strong>{aiStatsQ.data.pendingContracts.toLocaleString("bg-BG")}</strong> без AI анализ
          </span>
          {aiStatsQ.data.geminiModel.includes("flash-lite") && (
            <>
              <span className="text-[color:var(--color-text-muted)]">·</span>
              <span className="font-medium text-red-800">
                Моделът {aiStatsQ.data.geminiModel} е deprecated — сменете на gemini-2.5-flash в .env
              </span>
            </>
          )}
        </div>
      )}

      {/* Background jobs */}
      {jobs.length > 0 && (
        <section className="rounded-[var(--radius-lg)] border border-border-default/35 bg-white/95 p-4">
          <h3 className="mb-1 font-display text-[0.95rem] font-semibold">Задачи</h3>
          <p className="mb-3 text-[0.78rem] text-[color:var(--color-text-muted)]">
            Импортите се изпълняват на сървъра — SIGMA отнема няколко минути. Може да
            затворите панела, работата продължава.
          </p>
          <ul className="space-y-2">
            {jobs.map((job) => (
              <li
                key={job.key}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[var(--radius-md)] border border-border-default/30 px-3 py-2 text-[0.82rem]"
              >
                <i
                  className={cn(
                    "bi",
                    isJobActive(job)
                      ? "bi-arrow-repeat animate-spin text-blue-700"
                      : job.status === "FAILED"
                        ? "bi-x-circle text-red-700"
                        : "bi-check-circle text-emerald-700",
                  )}
                />
                <span className="font-medium">{job.label}</span>
                <StatusBadge status={job.status} />
                {job.startedAt && (
                  <span className="tabular-nums text-[color:var(--color-text-muted)]">
                    {fmtDate(job.startedAt)}
                  </span>
                )}
                <span
                  className="min-w-[12rem] flex-1 truncate text-[color:var(--color-text-secondary)]"
                  title={job.message ?? ""}
                >
                  {job.message ?? "—"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Actions */}
      <section className="rounded-[var(--radius-lg)] border border-border-default/35 bg-white/95 p-4">
        <h3 className="mb-3 font-display text-[0.95rem] font-semibold">Действия</h3>
        <div className="flex flex-wrap gap-2">
          <ActionButton
            icon="bi-cloud-download"
            label="SIGMA import"
            description="Договори от sigma.midt.bg (~4 мин)"
            loading={isJobActive(jobFor("SIGMA"))}
            disabled={busy}
            primary
            onClick={() => start(() => adminMonitorApi.triggerSigma())}
          />
          <ActionButton
            icon="bi-globe2"
            label="smolyan.bg scrape"
            description="Playwright sidecar :3099"
            loading={isJobActive(jobFor("SCRAPE"))}
            disabled={busy}
            onClick={() => start(() => adminMonitorApi.triggerScrape())}
          />
          <ActionButton
            icon="bi-file-earmark-text"
            label="SmolyanVote синтезиран доклад (регион)"
            description="Пълен синтез: парите, нередностите, заключения"
            loading={isJobActive(jobFor("AI_REPORT"))}
            disabled={busy}
            onClick={() => start(() => adminMonitorApi.generateRegionalReport())}
          />
          <ActionButton
            icon="bi-lightbulb"
            label="Обогати анализи"
            description="Rule-based заглавия (без Gemini, мигновено)"
            loading={isJobActive(jobFor("ENRICH"))}
            disabled={busy}
            onClick={() => start(() => adminMonitorApi.enrichInsights())}
          />
          <ActionButton
            icon="bi-stars"
            label={`AI batch (${aiBatchLimit})`}
            description="Пълен AI анализ по договори (риск ≥ 40)"
            loading={isJobActive(jobFor("AI"))}
            disabled={busy}
            onClick={() => start(() => adminMonitorApi.processAiBatch(aiBatchLimit))}
          />
          <ActionButton
            icon="bi-database-down"
            label="EOP import (7d)"
            description="storage.eop.bg fallback"
            loading={isJobActive(jobFor("EOP"))}
            disabled={busy}
            onClick={() => start(() => adminMonitorApi.triggerEop(7))}
          />
          <ActionButton
            icon="bi-database-fill-down"
            label="EOP backfill (30d)"
            description="Исторически bucket-и до 30 дни"
            loading={isJobActive(jobFor("EOP"))}
            disabled={busy}
            onClick={() => start(() => adminMonitorApi.triggerEop(30))}
          />
          <ActionButton
            icon="bi-file-earmark-pdf"
            label="OCR batch"
            description="Tesseract за PDF сканове"
            loading={isJobActive(jobFor("OCR"))}
            disabled={busy}
            onClick={() => start(() => adminMonitorApi.ocrBatch(10))}
          />
          <ActionButton
            icon="bi-people"
            label="Sync съветници"
            description="smolyan.bg → профили"
            loading={isJobActive(jobFor("COUNCILORS"))}
            disabled={busy}
            onClick={() => start(() => adminMonitorApi.syncCouncilors())}
          />
          <ActionButton
            icon="bi-building-check"
            label="Търговски регистър"
            description="Enrich top 50 фирми"
            loading={isJobActive(jobFor("TRADE_REGISTER"))}
            disabled={busy}
            onClick={() => start(() => adminMonitorApi.enrichTradeRegister(50))}
          />
          <ActionButton
            icon="bi-lightning-charge"
            label="Пълен pipeline"
            description="SIGMA → EOP → scrape → OCR → AI → TR → съветници"
            loading={isJobActive(jobFor("PIPELINE"))}
            disabled={busy}
            onClick={() => start(() => adminMonitorApi.triggerPipeline())}
          />
          <ActionButton
            icon="bi-arrow-clockwise"
            label="Обнови"
            description="Презареди данните"
            disabled={busy}
            onClick={() => {
              refreshData();
              void jobsQ.refetch();
            }}
          />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <label className="text-[0.8rem] text-[color:var(--color-text-secondary)]">
            AI batch limit
            <select
              value={aiBatchLimit}
              onChange={(e) => setAiBatchLimit(Number(e.target.value))}
              className="ml-2 rounded border border-border-default px-2 py-1 text-[0.8rem]"
            >
              {[10, 25, 30, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* Ingestion logs */}
      <section>
        <h3 className="mb-3 font-display text-[0.95rem] font-semibold">Логове на ingestion</h3>
        {logsQ.isLoading ? (
          <Skeleton className="h-40 w-full rounded-[var(--radius-lg)]" />
        ) : (
          <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border-default/35">
            <table className="w-full min-w-[640px] text-left text-[0.82rem]">
              <thead className="bg-[color:var(--color-surface-muted)] text-[0.72rem] uppercase tracking-wide text-[color:var(--color-text-muted)]">
                <tr>
                  <th className="px-3 py-2">Тип</th>
                  <th className="px-3 py-2">Статус</th>
                  <th className="px-3 py-2">Старт</th>
                  <th className="px-3 py-2">Записи</th>
                  <th className="px-3 py-2">Съобщение</th>
                  <th className="px-3 py-2 text-right">Retry</th>
                </tr>
              </thead>
              <tbody>
                {(logsQ.data ?? []).map((log) => (
                  <tr key={log.id} className="border-t border-border-default/25">
                    <td className="px-3 py-2 font-medium">{log.ingestionType}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={log.status} />
                    </td>
                    <td className="px-3 py-2 tabular-nums text-[color:var(--color-text-muted)]">
                      {fmtDate(log.startedAt)}
                    </td>
                    <td className="px-3 py-2 tabular-nums">{log.recordsProcessed ?? "—"}</td>
                    <td className="max-w-xs truncate px-3 py-2 text-[color:var(--color-text-secondary)]" title={log.message ?? ""}>
                      {log.message ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {["FAILED", "PARTIAL"].includes(log.status.toUpperCase()) && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => retryIngestion(log.ingestionType)}
                          className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[0.72rem] font-medium text-red-800 hover:bg-red-100 disabled:opacity-40"
                        >
                          <i className="bi bi-arrow-repeat mr-1" />
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {(logsQ.data ?? []).length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-[color:var(--color-text-muted)]">
                      Няма логове — пуснете SIGMA или scrape
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  detail,
  tone,
}: {
  title: string;
  value: string;
  detail: string;
  tone?: "ok" | "warn" | "err" | "neutral";
}) {
  const border =
    tone === "ok"
      ? "border-emerald-200"
      : tone === "warn"
        ? "border-amber-200"
        : tone === "err"
          ? "border-red-200"
          : "border-border-default/35";
  return (
    <div className={cn("rounded-[var(--radius-lg)] border bg-white/95 p-4", border)}>
      <p className="text-[0.72rem] font-semibold uppercase tracking-wide text-[color:var(--color-text-muted)]">
        {title}
      </p>
      <p className="mt-1 font-display text-[1.2rem] font-bold">{value}</p>
      <p className="mt-1 text-[0.78rem] text-[color:var(--color-text-secondary)]">{detail}</p>
    </div>
  );
}

export function ActionButton({
  icon,
  label,
  description,
  onClick,
  loading,
  disabled,
  primary,
}: {
  icon: string;
  label: string;
  description: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(
        "flex min-w-[140px] flex-col items-start rounded-[var(--radius-md)] border px-3 py-2.5 text-left transition",
        primary
          ? "border-primary bg-primary text-white shadow-sm hover:bg-primary/90"
          : "border-border-default/40 bg-white hover:bg-primary-50/50",
        (disabled || loading) && "opacity-50",
      )}
    >
      <span className="flex items-center gap-1.5 text-[0.85rem] font-semibold">
        <i className={cn("bi", icon, loading && "animate-spin")} />
        {loading ? "…" : label}
      </span>
      <span className={cn("mt-0.5 text-[0.68rem]", primary ? "text-white/80" : "text-[color:var(--color-text-muted)]")}>
        {description}
      </span>
    </button>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase();
  const cls =
    s === "SUCCESS"
      ? "bg-emerald-100 text-emerald-800"
      : s === "RUNNING" || s === "QUEUED"
        ? "bg-blue-100 text-blue-800"
        : s === "PARTIAL" || s === "BUSY"
          ? "bg-amber-100 text-amber-800"
          : s === "FAILED"
            ? "bg-red-100 text-red-800"
            : "bg-gray-100 text-gray-700";
  return <span className={cn("rounded-full px-2 py-0.5 text-[0.68rem] font-semibold", cls)}>{status}</span>;
}

export function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("bg-BG");
  } catch {
    return iso;
  }
}

function statusTone(status: string): "ok" | "warn" | "err" | "neutral" {
  const s = status.toUpperCase();
  if (s === "SUCCESS") return "ok";
  if (s === "FAILED") return "err";
  if (s === "RUNNING" || s === "QUEUED" || s === "PARTIAL") return "warn";
  return "neutral";
}
