"use client";

import { useQuery } from "@tanstack/react-query";
import { ErrorState, Skeleton } from "@/shared/ui";
import { useAdminDashboard } from "../hooks/useAdminDashboard";
import { adminApi } from "../api";
import {
  asString,
  dig,
  formatBytes,
  formatMs,
  formatNumber,
  formatPercent,
  pick,
} from "../lib/formatters";
import { CollapsibleSection } from "./CollapsibleSection";
import { MetricGrid, StatusPill } from "./MetricGrid";

export function HealthDashboard({ enabled }: { enabled: boolean }) {
  const { data, isPending, isError, refetch, isFetching, dataUpdatedAt } =
    useAdminDashboard(enabled);

  const alertsQ = useQuery({
    queryKey: ["admin", "health-alerts"],
    queryFn: () => adminApi.healthAlerts(),
    enabled,
    refetchInterval: 30_000,
  });

  if (isPending) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-[var(--radius-lg)]" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return <ErrorState description="Dashboard данните не можаха да се заредят." onRetry={() => refetch()} />;
  }

  const { aggregate, cloudinary, email, httpStatus, responseTime, memory, recentErrors } = data;
  const healthStatus = asString(pick(aggregate.health, "status"), "UNKNOWN");
  const dbStatus = asString(pick(aggregate.dbHealth, "status"), "UNKNOWN");
  const cloudStatus = asString(pick(cloudinary, "status"), "UNKNOWN");
  const emailStatus = asString(pick(email, "status"), "UNKNOWN");

  const recentList = Array.isArray(recentErrors.errors)
    ? (recentErrors.errors as Record<string, unknown>[])
    : Array.isArray(recentErrors.recent)
      ? (recentErrors.recent as Record<string, unknown>[])
      : [];

  return (
    <div className="flex flex-col gap-4">
      {(alertsQ.data?.alerts?.length ?? 0) > 0 && (
        <ul className="flex flex-col gap-2">
          {alertsQ.data!.alerts.map((a, i) => (
            <li
              key={i}
              className={
                a.level === "critical"
                  ? "rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm"
                  : a.level === "warning"
                    ? "rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm"
                    : "rounded-md border border-border-default/60 px-3 py-2 text-sm"
              }
            >
              <strong>{a.title}:</strong> {a.message}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[color:var(--color-text-muted)]">
          Последно обновяване:{" "}
          {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString("bg-BG") : "—"}
          {isFetching ? " · обновява…" : ""} · auto 30s
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="rounded-[var(--radius-md)] border border-border-default/60 px-3 py-1.5 text-xs font-medium hover:border-primary/40"
        >
          <i className="bi bi-arrow-clockwise mr-1" />
          Обнови
        </button>
      </div>

      <CollapsibleSection title="Общо здраве" icon="bi-heart-pulse" badge={<StatusPill status={healthStatus} />}>
        <MetricGrid
          items={[
            { label: "Статус", value: healthStatus, tone: healthStatus.toLowerCase().includes("up") ? "ok" : "bad" },
            { label: "Приложение", value: asString(pick(aggregate.appInfo, "name", "applicationName")) },
            { label: "Версия", value: asString(pick(aggregate.appInfo, "version", "appVersion")) },
            { label: "Uptime", value: asString(pick(aggregate.appInfo, "uptime", "uptimeFormatted")) },
          ]}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Услуги" icon="bi-hdd-network">
        <MetricGrid
          items={[
            { label: "Database", value: dbStatus, tone: dbStatus.toLowerCase().includes("up") ? "ok" : "bad" },
            {
              label: "Cloudinary",
              value: cloudStatus,
              tone: cloudStatus.toLowerCase().includes("up") ? "ok" : "warn",
            },
            {
              label: "Email",
              value: emailStatus,
              tone: emailStatus.toLowerCase().includes("up") ? "ok" : "warn",
            },
          ]}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Системни метрики" icon="bi-cpu">
        <MetricGrid
          items={[
            {
              label: "CPU",
              value: formatPercent(pick(aggregate.metrics, "cpuUsage", "systemCpuUsage")),
            },
            {
              label: "Памет",
              value: `${formatBytes(pick(aggregate.metrics, "memoryUsed"))} / ${formatBytes(pick(aggregate.metrics, "memoryMax"))}`,
            },
            {
              label: "Памет %",
              value: formatPercent(pick(aggregate.metrics, "memoryUsagePercent")),
            },
            {
              label: "Нишки",
              value: formatNumber(pick(aggregate.metrics, "activeThreads", "threads")),
            },
            {
              label: "HTTP заявки",
              value: formatNumber(pick(aggregate.metrics, "totalHttpRequests")),
            },
          ]}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Response time" icon="bi-speedometer2" defaultOpen={false}>
        <MetricGrid
          items={[
            { label: "Avg", value: formatMs(pick(responseTime, "average", "avg", "mean")) },
            { label: "Max", value: formatMs(pick(responseTime, "max", "maximum")) },
            { label: "P95", value: formatMs(pick(responseTime, "p95", "percentile95")) },
            { label: "P99", value: formatMs(pick(responseTime, "p99", "percentile99")) },
          ]}
        />
      </CollapsibleSection>

      <CollapsibleSection title="HTTP статус кодове" icon="bi-bar-chart" defaultOpen={false}>
        <MetricGrid
          items={[
            { label: "2xx", value: formatNumber(pick(httpStatus, "2xx", "status2xx", "ok")), tone: "ok" },
            { label: "3xx", value: formatNumber(pick(httpStatus, "3xx", "status3xx")) },
            { label: "4xx", value: formatNumber(pick(httpStatus, "4xx", "status4xx")), tone: "warn" },
            { label: "5xx", value: formatNumber(pick(httpStatus, "5xx", "status5xx")), tone: "bad" },
            { label: "200", value: formatNumber(dig(httpStatus, "statuses.200") ?? pick(httpStatus, "200")) },
            { label: "404", value: formatNumber(dig(httpStatus, "statuses.404") ?? pick(httpStatus, "404")) },
            { label: "500", value: formatNumber(dig(httpStatus, "statuses.500") ?? pick(httpStatus, "500")) },
          ]}
        />
      </CollapsibleSection>

      <CollapsibleSection title="JVM" icon="bi-gear" defaultOpen={false}>
        <MetricGrid
          items={[
            {
              label: "Heap used",
              value: formatBytes(pick(aggregate.jvmMetrics, "heapUsed", "usedHeap")),
            },
            {
              label: "Heap max",
              value: formatBytes(pick(aggregate.jvmMetrics, "heapMax", "maxHeap")),
            },
            {
              label: "Non-heap",
              value: formatBytes(pick(aggregate.jvmMetrics, "nonHeapUsed", "usedNonHeap")),
            },
            {
              label: "GC count",
              value: formatNumber(pick(aggregate.jvmMetrics, "gcCount", "garbageCollectionCount")),
            },
            {
              label: "Threads live",
              value: formatNumber(pick(aggregate.jvmMetrics, "liveThreads", "threadCount")),
            },
          ]}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Ресурси" icon="bi-device-hdd" defaultOpen={false}>
        <MetricGrid
          items={[
            {
              label: "Disk free",
              value: formatBytes(pick(aggregate.diskSpace, "free", "freeSpace")),
            },
            {
              label: "Disk total",
              value: formatBytes(pick(aggregate.diskSpace, "total", "totalSpace")),
            },
            {
              label: "Disk used %",
              value: formatPercent(pick(aggregate.diskSpace, "usedPercent", "usagePercent")),
            },
            {
              label: "DB pool active",
              value: formatNumber(pick(aggregate.dbPool, "active", "activeConnections")),
            },
            {
              label: "DB pool idle",
              value: formatNumber(pick(aggregate.dbPool, "idle", "idleConnections")),
            },
            {
              label: "DB pool max",
              value: formatNumber(pick(aggregate.dbPool, "max", "maxConnections")),
            },
            {
              label: "Memory detail",
              value: formatBytes(pick(memory, "used", "heapUsed")),
            },
          ]}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Грешки" icon="bi-exclamation-triangle" defaultOpen={false}>
        <MetricGrid
          items={[
            {
              label: "Error rate",
              value: formatPercent(pick(aggregate.errorRates, "errorRate", "rate")),
              tone: "bad",
            },
            {
              label: "Errors / min",
              value: formatNumber(pick(aggregate.errorRates, "errorsPerMinute", "perMinute")),
            },
            {
              label: "Total errors",
              value: formatNumber(pick(aggregate.errorRates, "totalErrors", "total")),
            },
          ]}
        />
        {recentList.length > 0 && (
          <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto text-xs text-[color:var(--color-text-secondary)]">
            {recentList.slice(0, 20).map((err, i) => (
              <li key={i} className="rounded bg-[color:var(--color-surface-muted)] px-2 py-1">
                {asString(pick(err, "message", "error", "exception"), JSON.stringify(err))}
              </li>
            ))}
          </ul>
        )}
      </CollapsibleSection>
    </div>
  );
}
