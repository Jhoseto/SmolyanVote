"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ErrorState, Skeleton } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useToast } from "@/shared/hooks/useToast";
import { useConfirm } from "@/shared/hooks/useConfirm";
import { errorMessage } from "@/shared/lib/errorMessage";
import { formatActivityTimestamp, formatBulgarianDateTime } from "@/shared/lib/formatRelativeDate";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { adminApi } from "../api";
import {
  sendActivitySocket,
  setActivityLiveEnabled,
  subscribeActivitySocket,
  subscribeActivityStatus,
  normalizeActivityItems,
  type ActivitySocketStatus,
} from "../lib/activitySocket";
import {
  ACTIVITY_PAGE_SIZE,
  DEFAULT_ACTIVITY_FEED_FILTERS,
  activityFiltersToApiParams,
  facetsToFilterOptions,
  filtersAffectServerQuery,
  resolveActivityIp,
  type ActivityFeedFilters,
} from "../lib/activityFeedFilters";
import type { ActivityStats } from "../types";
import { ActivityFeedToolbar } from "./ActivityFeedToolbar";
import { MetricGrid } from "./MetricGrid";

type View = "feed" | "analytics" | "settings" | "audit";

function ActivityIpBadge({ ip }: { ip: string | null }) {
  if (!ip) {
    return (
      <span className="shrink-0 font-mono text-[10px] text-[color:var(--color-text-muted)]">IP: —</span>
    );
  }

  return (
    <span
      className="shrink-0 rounded bg-[color:var(--color-surface-muted)] px-1.5 py-0.5 font-mono text-[10px] text-[color:var(--color-text-primary)]"
      title={`IP адрес: ${ip}`}
    >
      {ip}
    </span>
  );
}

export function ActivityPanel({ enabled }: { enabled: boolean }) {
  const toast = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>("feed");
  const [live, setLive] = useState(false);
  const [socketStatus, setSocketStatus] = useState<ActivitySocketStatus>("idle");
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [feedFilters, setFeedFilters] = useState<ActivityFeedFilters>(DEFAULT_ACTIVITY_FEED_FILTERS);
  const [feedPage, setFeedPage] = useState(0);
  const debouncedQuery = useDebounce(feedFilters.query, 300);
  const parentRef = useRef<HTMLDivElement>(null);

  const serverFilters = useMemo(
    () => filtersAffectServerQuery(feedFilters, debouncedQuery),
    [feedFilters, debouncedQuery],
  );

  useEffect(() => {
    setFeedPage(0);
  }, [
    debouncedQuery,
    feedFilters.username,
    feedFilters.action,
    feedFilters.entityType,
    feedFilters.typeCategory,
    feedFilters.timeRange,
    feedFilters.ipOnly,
    feedFilters.sortField,
    feedFilters.sortDir,
  ]);

  const feedQ = useQuery({
    queryKey: ["admin", "activities", "feed", serverFilters, feedPage],
    queryFn: () => adminApi.activitiesFiltered(activityFiltersToApiParams(serverFilters, feedPage)),
    enabled: enabled && view === "feed",
    placeholderData: keepPreviousData,
  });

  const facetsQ = useQuery({
    queryKey: ["admin", "activities", "facets"],
    queryFn: () => adminApi.activityFacets(),
    enabled: enabled && view === "feed",
    staleTime: 5 * 60_000,
  });

  const statsQ = useQuery({
    queryKey: ["admin", "activities", "stats"],
    queryFn: () => adminApi.activityStats(),
    enabled: enabled && view !== "audit",
    refetchInterval: live ? false : 15_000,
  });

  useEffect(() => {
    if (statsQ.data?.stats) setStats(statsQ.data.stats);
  }, [statsQ.data]);

  const auditQ = useQuery({
    queryKey: ["admin", "activities", "audit"],
    queryFn: () => adminApi.adminActions(0, 100),
    enabled: enabled && view === "audit",
  });

  useEffect(() => {
    if (!enabled) return;
    const unsubStatus = subscribeActivityStatus(setSocketStatus);
    const unsubMsg = subscribeActivitySocket((msg) => {
      if (msg.type === "new_activity" && view === "feed" && feedPage === 0 && live) {
        void queryClient.invalidateQueries({ queryKey: ["admin", "activities", "feed"] });
      }
      if ((msg.type === "statistics" || msg.type === "stats_update") && msg.stats) {
        setStats(msg.stats);
      }
      if (msg.type === "statistics" && msg.data && typeof msg.data === "object" && !msg.stats) {
        setStats(msg.data as ActivityStats);
      }
    });
    return () => {
      unsubStatus();
      unsubMsg();
      setActivityLiveEnabled(false);
    };
  }, [enabled, view, feedPage, live, queryClient]);

  useEffect(() => {
    if (!enabled) return;
    setActivityLiveEnabled(live);
  }, [live, enabled]);

  const filterOptions = useMemo(
    () => facetsToFilterOptions(facetsQ.data?.facets ?? {}),
    [facetsQ.data],
  );

  const displayItems = useMemo(
    () => normalizeActivityItems(feedQ.data?.activities ?? []),
    [feedQ.data?.activities],
  );

  const totalMatching = feedQ.data?.totalElements ?? 0;
  const totalPages = feedQ.data?.totalPages ?? 1;

  const analyticsQ = useQuery({
    queryKey: ["admin", "activities", "analytics"],
    queryFn: async () => {
      const [topUsersRes, topActionsRes, statsRes] = await Promise.all([
        adminApi.topUsers(10, 24),
        adminApi.topActions(24),
        adminApi.activityStats(),
      ]);
      return {
        topUsers: topUsersRes.topUsers ?? statsRes.stats?.topUsers ?? [],
        topActions: topActionsRes.topActions ?? statsRes.stats?.topActions ?? [],
      };
    },
    enabled: enabled && view === "analytics",
    staleTime: 60_000,
  });

  const virtualizer = useVirtualizer({
    count: displayItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 10,
  });

  const topUsersChart = useMemo(() => {
    const list =
      analyticsQ.data?.topUsers?.length ? analyticsQ.data.topUsers : (stats?.topUsers ?? []);
    return list.map((u) => ({ name: u.username, count: u.activityCount }));
  }, [analyticsQ.data, stats]);

  const topActionsChart = useMemo(() => {
    const list =
      analyticsQ.data?.topActions?.length ? analyticsQ.data.topActions : (stats?.topActions ?? []);
    return list.map((a) => ({ name: a.action, count: a.count }));
  }, [analyticsQ.data, stats]);

  async function exportCsv() {
    try {
      await adminApi.exportActivitiesCsv();
      toast.success("CSV изтеглен");
    } catch (e) {
      toast.error(errorMessage(e, "Export не успя"));
    }
  }

  async function cleanup() {
    const ok = await confirm({
      title: "Изчистване на стари активности",
      description: "Ще се запазят последните 90 дни.",
      confirmText: "Изчисти",
      destructive: true,
    });
    if (!ok) return;
    try {
      await adminApi.cleanupActivities(90);
      toast.success("Cleanup стартиран");
    } catch (e) {
      toast.error(errorMessage(e, "Cleanup не успя"));
    }
  }

  if (view === "feed" && feedQ.isPending && displayItems.length === 0) {
    return <Skeleton className="h-96 w-full rounded-[var(--radius-lg)]" />;
  }
  if (view === "feed" && feedQ.isError && displayItems.length === 0) {
    return (
      <ErrorState description="Активностите не можаха да се заредят." onRetry={() => feedQ.refetch()} />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {(["feed", "analytics", "audit", "settings"] as View[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={cn(
              "rounded-[var(--radius-md)] px-3 py-1.5 text-xs font-medium",
              view === v ? "bg-primary text-white" : "border border-border-default/60",
            )}
          >
            {v === "feed"
              ? "Лента"
              : v === "analytics"
                ? "Анализ"
                : v === "audit"
                  ? "Admin audit"
                  : "Настройки"}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={live}
            onChange={(e) => setLive(e.target.checked)}
          />
          Live ({socketStatus === "open" ? "свързан" : socketStatus})
        </label>
        <button type="button" onClick={() => void exportCsv()} className="rounded border px-2 py-1 text-xs">
          Export CSV
        </button>
        {live && socketStatus === "open" && (
          <button
            type="button"
            onClick={() => sendActivitySocket({ type: "get_recent", data: { limit: 500 } })}
            className="rounded border px-2 py-1 text-xs"
          >
            Refresh WS
          </button>
        )}
      </div>

      {stats && (
        <MetricGrid
          items={[
            { label: "Последния час", value: String(stats.lastHour ?? 0) },
            { label: "Днес", value: String(stats.today ?? 0) },
            { label: "Онлайн", value: String(stats.onlineUsers ?? 0) },
          ]}
        />
      )}

      {view === "audit" && (
        <ul className="divide-y divide-border-default/40 rounded-[var(--radius-lg)] border border-border-default/60">
          {(auditQ.data?.activities ?? []).map((a) => (
            <li key={a.id} className="flex flex-wrap items-start justify-between gap-2 px-4 py-3 text-sm">
              <div className="min-w-0">
                <span className="font-medium">{a.displayText ?? a.action}</span>
                <span className="ml-2 text-[color:var(--color-text-muted)]">
                  {a.username ?? "—"} ·{" "}
                  <time dateTime={a.timestamp} title={formatBulgarianDateTime(a.timestamp)}>
                    {formatActivityTimestamp(a.timestamp)}
                  </time>
                </span>
              </div>
              <ActivityIpBadge ip={resolveActivityIp(a)} />
            </li>
          ))}
          {auditQ.isPending && <li className="px-4 py-3 text-sm">Зареждане…</li>}
        </ul>
      )}

      {view === "settings" && (
        <div className="rounded-[var(--radius-lg)] border border-border-default/60 p-4">
          <p className="text-sm text-[color:var(--color-text-secondary)]">
            WebSocket endpoint: <code>/ws/admin/activity/ws</code> (JWT query token). Cleanup изтрива записи
            по-стари от retention.
          </p>
          <button
            type="button"
            onClick={() => void cleanup()}
            className="mt-3 rounded bg-[color:var(--color-error)] px-3 py-1.5 text-xs text-white"
          >
            Cleanup (90 дни)
          </button>
        </div>
      )}

      {view === "analytics" && analyticsQ.isPending && (
        <Skeleton className="h-48 w-full rounded-[var(--radius-lg)]" />
      )}

      {view === "analytics" && !analyticsQ.isPending && (
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Топ потребители">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topUsersChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#19861c" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Топ действия">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topActionsChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#48a24c" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {view === "feed" && (
        <>
          <ActivityFeedToolbar
            filters={feedFilters}
            onChange={setFeedFilters}
            options={filterOptions}
            page={feedPage}
            totalPages={totalPages}
            totalMatching={totalMatching}
            pageSize={ACTIVITY_PAGE_SIZE}
            isFetching={feedQ.isFetching}
            onPageChange={setFeedPage}
          />

          <div
            ref={parentRef}
            className="h-[480px] overflow-y-auto rounded-[var(--radius-lg)] border border-border-default/60"
          >
            {displayItems.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[color:var(--color-text-muted)]">
                {feedQ.isFetching ? "Зареждане…" : "Няма резултати за текущите филтри."}
              </p>
            ) : (
              <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
                {virtualizer.getVirtualItems().map((row) => {
                  const item = displayItems[row.index];
                  const ip = resolveActivityIp(item);
                  return (
                    <div
                      key={item.id}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        transform: `translateY(${row.start}px)`,
                      }}
                      className="flex items-start gap-2 border-b border-border-default/40 px-3 py-2 text-sm"
                    >
                      <i className={cn("bi mt-0.5 shrink-0", item.iconClass || "bi-circle")} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 truncate font-medium">{item.displayText || item.action}</p>
                          <ActivityIpBadge ip={ip} />
                        </div>
                        <p className="text-[11px] text-[color:var(--color-text-muted)]">
                          {item.username ?? "—"}
                          {item.timestamp ? (
                            <>
                              {" · "}
                              <time dateTime={item.timestamp} title={formatBulgarianDateTime(item.timestamp)}>
                                {formatActivityTimestamp(item.timestamp)}
                              </time>
                            </>
                          ) : (
                            ""
                          )}
                          {item.entityType ? ` · ${item.entityType}` : ""}
                          {item.entityId != null ? ` #${item.entityId}` : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border-default/60 p-3">
      <h4 className="mb-2 text-sm font-bold">{title}</h4>
      {children}
    </div>
  );
}
