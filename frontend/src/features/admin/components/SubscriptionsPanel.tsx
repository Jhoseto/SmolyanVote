"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ErrorState, Skeleton } from "@/shared/ui";
import { adminApi } from "../api";
import { MetricGrid } from "./MetricGrid";

export function SubscriptionsPanel({ enabled }: { enabled: boolean }) {
  const [page, setPage] = useState(0);

  const statsQ = useQuery({
    queryKey: ["admin", "subscription-stats"],
    queryFn: () => adminApi.subscriptionStatistics(),
    enabled,
  });

  const listQ = useQuery({
    queryKey: ["admin", "subscriptions", page],
    queryFn: () => adminApi.subscriptions({ page, size: 50 }),
    enabled,
  });

  if (statsQ.isLoading || listQ.isLoading) {
    return <Skeleton className="h-64 w-full rounded-[var(--radius-lg)]" />;
  }
  if (statsQ.isError || listQ.isError) {
    return (
      <ErrorState
        description="Абонаментите не се заредиха"
        onRetry={() => {
          statsQ.refetch();
          listQ.refetch();
        }}
      />
    );
  }

  const stats = statsQ.data ?? {};
  const rows = listQ.data?.subscriptions ?? [];

  return (
    <div className="flex flex-col gap-4">
      <MetricGrid
        items={[
          { label: "Общо абонати", value: String(stats.totalSubscribers ?? 0) },
          { label: "Подкаст", value: String(stats.PODCAST_EPISODES ?? 0) },
          { label: "Избори", value: String(stats.ELECTION_UPDATES ?? 0) },
          { label: "Новини", value: String(stats.CITY_NEWS ?? 0) },
        ]}
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => adminApi.exportSubscriptionsCsv()}
          className="rounded-[var(--radius-md)] border px-4 py-2 text-sm"
        >
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border-default/60">
        <table className="min-w-full text-sm">
          <thead className="bg-[color:var(--color-surface-muted)]">
            <tr>
              <th className="px-3 py-2 text-left">Потребител</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Тип</th>
              <th className="px-3 py-2 text-left">Активен</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-[color:var(--color-text-muted)]">
                  Няма активни абонати.
                </td>
              </tr>
            ) : (
              rows.map((s) => (
              <tr key={s.id} className="border-t border-border-default/40">
                <td className="px-3 py-2">{s.username ?? "—"}</td>
                <td className="px-3 py-2">{s.email ?? "—"}</td>
                <td className="px-3 py-2">{s.type}</td>
                <td className="px-3 py-2">{s.active ? "Да" : "Не"}</td>
              </tr>
            ))
            )}
          </tbody>
        </table>
      </div>

      {listQ.data && listQ.data.totalPages > 1 && (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 0}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-[var(--radius-md)] border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Назад
          </button>
          <span className="self-center text-sm">
            {page + 1} / {listQ.data.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= listQ.data.totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-[var(--radius-md)] border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Напред
          </button>
        </div>
      )}
    </div>
  );
}
