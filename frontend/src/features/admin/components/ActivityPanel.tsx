"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useQuery } from "@tanstack/react-query";
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
import { formatRelativeDate } from "@/shared/lib/formatRelativeDate";
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
  DEFAULT_ACTIVITY_FEED_FILTERS,
  deriveFilterOptions,
  filterAndSortActivities,
  resolveActivityIp,
  type ActivityFeedFilters,
} from "../lib/activityFeedFilters";
import {
  ACTIVITY_PAGE_SIZE,
  mergeActivityItems,
  oldestActivityTimestamp,
} from "../lib/activityFeedMerge";
import type { ActivityItem, ActivityStats } from "../types";
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
  const [view, setView] = useState<View>("feed");
  const [live, setLive] = useState(false);
  const [socketStatus, setSocketStatus] = useState<ActivitySocketStatus>("idle");
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [feedFilters, setFeedFilters] = useState<ActivityFeedFilters>(DEFAULT_ACTIVITY_FEED_FILTERS);
  const [historyPage, setHistoryPage] = useState(0);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [totalInDatabase, setTotalInDatabase] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);

  const recentQ = useQuery({
    queryKey: ["admin", "activities", "recent", ACTIVITY_PAGE_SIZE],
    queryFn: async () => {
      const [feed, statsRes] = await Promise.all([
        adminApi.activitiesFiltered({
          page: 0,
          size: ACTIVITY_PAGE_SIZE,
          sortBy: "timestamp",
          sortDir: "desc",
        }),
        adminApi.activityStats(),
      ]);
      return {
        activities: feed.activities ?? [],
        stats: statsRes.stats,
        totalElements: feed.totalElements ?? feed.activities?.length ?? 0,
        hasNext: feed.hasNext ?? (feed.activities?.length ?? 0) >= ACTIVITY_PAGE_SIZE,
      };
    },
    enabled: enabled && !live && view !== "audit",
    refetchInterval: live ? false : 15_000,
  });

  const auditQ = useQuery({
    queryKey: ["admin", "activities", "audit"],
    queryFn: () => adminApi.adminActions(0, 100),
    enabled: enabled && view === "audit",
  });

  useEffect(() => {
    if (!enabled) return;
    if (recentQ.data?.activities) {
      setItems(normalizeActivityItems(recentQ.data.activities));
      setHistoryPage(0);
      setHasMoreHistory(recentQ.data.hasNext ?? false);
      setTotalInDatabase(recentQ.data.totalElements ?? null);
    }
    if (recentQ.data?.stats) setStats(recentQ.data.stats);
  }, [enabled, recentQ.data]);

  useEffect(() => {
    if (!enabled) return;
    const unsubStatus = subscribeActivityStatus(setSocketStatus);
    const unsubMsg = subscribeActivitySocket((msg) => {
      if (msg.type === "new_activity" && msg.data && typeof msg.data === "object") {
        const act = msg.data as ActivityItem;
        if (act.id != null) {
          const normalized = normalizeActivityItems([act])[0];
          setItems((prev) =>
            (prev.some((p) => p.id === normalized.id) ? prev : [normalized, ...prev]).slice(0, 2000),
          );
        }
      }
      if (
        (msg.type === "recent_activities" || msg.type === "activities_since") &&
        msg.activities
      ) {
        setItems((prev) => {
          const map = new Map<number, ActivityItem>();
          [...msg.activities!, ...prev].forEach((a) => map.set(a.id, a));
          return [...map.values()].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          );
        });
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
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    setActivityLiveEnabled(live);
    if (live) {
      void adminApi.activities(ACTIVITY_PAGE_SIZE).then((res) => {
        setItems(normalizeActivityItems(res.activities ?? []));
        if (res.stats) setStats(res.stats);
        setHistoryPage(0);
        setHasMoreHistory((res.activities?.length ?? 0) >= ACTIVITY_PAGE_SIZE);
      });
    }
  }, [live, enabled]);

  async function loadOlderActivities() {
    if (loadingMore || !hasMoreHistory) return;
    setLoadingMore(true);
    try {
      const nextPage = historyPage + 1;
      const res = await adminApi.activitiesFiltered({
        page: nextPage,
        size: ACTIVITY_PAGE_SIZE,
        sortBy: "timestamp",
        sortDir: "desc",
      });
      const incoming = normalizeActivityItems(res.activities ?? []);
      if (incoming.length === 0) {
        setHasMoreHistory(false);
      } else {
        setItems((prev) => mergeActivityItems(prev, incoming));
        setHistoryPage(nextPage);
        setHasMoreHistory(res.hasNext ?? incoming.length >= ACTIVITY_PAGE_SIZE);
        if (res.totalElements != null) setTotalInDatabase(res.totalElements);
      }
    } catch (e) {
      toast.error(errorMessage(e, "Неуспешно зареждане на по-стари записи"));
    } finally {
      setLoadingMore(false);
    }
  }

  const oldestLoadedLabel = useMemo(() => {
    const oldest = oldestActivityTimestamp(items);
    return oldest ? formatRelativeDate(oldest.toISOString()) : null;
  }, [items]);

  const filterOptions = useMemo(() => deriveFilterOptions(items), [items]);

  const displayItems = useMemo(
    () => filterAndSortActivities(items, feedFilters),
    [items, feedFilters],
  );

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

  if (recentQ.isPending && items.length === 0) {
    return <Skeleton className="h-96 w-full rounded-[var(--radius-lg)]" />;
  }
  if (recentQ.isError && items.length === 0) {
    return (
      <ErrorState description="Активностите не можаха да се заредят." onRetry={() => recentQ.refetch()} />
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
                  {a.username ?? "—"} · {formatRelativeDate(a.timestamp)}
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
            totalCount={items.length}
            filteredCount={displayItems.length}
            totalInDatabase={totalInDatabase}
            oldestLoadedLabel={oldestLoadedLabel}
            hasMoreHistory={hasMoreHistory}
            loadingMore={loadingMore}
            onLoadOlder={() => void loadOlderActivities()}
          />

          <div
            ref={parentRef}
            className="h-[480px] overflow-y-auto rounded-[var(--radius-lg)] border border-border-default/60"
          >
            {displayItems.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[color:var(--color-text-muted)]">
                {items.length === 0
                  ? "Няма заредени активности."
                  : "Няма резултати за текущите филтри."}
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
                          {item.timestamp ? ` · ${formatRelativeDate(item.timestamp)}` : ""}
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
