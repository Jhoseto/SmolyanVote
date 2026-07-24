"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ErrorState, Skeleton } from "@/shared/ui";
import { adminApi } from "../api";

export function EventsAdminPanel({ enabled }: { enabled: boolean }) {
  const [search, setSearch] = useState("");
  const [reportedOnly, setReportedOnly] = useState(false);

  const q = useQuery({
    queryKey: ["admin", "events", search, reportedOnly],
    queryFn: () => adminApi.adminEvents({ search, reportedOnly }),
    enabled,
  });

  if (q.isLoading) return <Skeleton className="h-64 w-full rounded-[var(--radius-lg)]" />;
  if (q.isError) return <ErrorState description="Събитията не се заредиха" onRetry={() => q.refetch()} />;

  const events = q.data?.events ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Търсене по заглавие…"
          className="rounded-[var(--radius-md)] border px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={reportedOnly}
            onChange={(e) => setReportedOnly(e.target.checked)}
          />
          Само с репорти
        </label>
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border-default/60">
        <table className="min-w-full text-sm">
          <thead className="bg-[color:var(--color-surface-muted)]">
            <tr>
              <th className="px-3 py-2 text-left">Заглавие</th>
              <th className="px-3 py-2 text-left">Тип</th>
              <th className="px-3 py-2 text-left">Автор</th>
              <th className="px-3 py-2 text-left">Репорти</th>
              <th className="px-3 py-2 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {events.map((ev) => (
              <tr key={`${ev.type}-${ev.id}`} className="border-t border-border-default/40">
                <td className="px-3 py-2">{ev.title}</td>
                <td className="px-3 py-2">{ev.type}</td>
                <td className="px-3 py-2">{ev.creatorName ?? "—"}</td>
                <td className="px-3 py-2">{ev.reportCount}</td>
                <td className="px-3 py-2 text-right">
                  <Link href={ev.editPath} className="text-primary">
                    Редакция
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
