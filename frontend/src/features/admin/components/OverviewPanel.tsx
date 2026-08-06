"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ErrorState, Skeleton } from "@/shared/ui";
import { adminApi } from "../api";
import { MetricGrid } from "./MetricGrid";
import { StatusPill } from "./MetricGrid";

export function OverviewPanel({ enabled }: { enabled: boolean }) {
  const q = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => adminApi.overview(),
    enabled,
    refetchInterval: 60_000,
  });

  if (q.isLoading) return <Skeleton className="h-96 w-full rounded-[var(--radius-lg)]" />;
  if (q.isError) return <ErrorState description="Неуспешно зареждане на обзора" onRetry={() => q.refetch()} />;

  const data = q.data!;
  const alerts = data.healthAlerts?.alerts ?? [];

  return (
    <div className="flex flex-col gap-6">
      {alerts.length > 0 && (
        <section className="rounded-[var(--radius-lg)] border border-border-default/60 p-4">
          <h2 className="mb-3 text-lg font-semibold">Алерти</h2>
          <ul className="flex flex-col gap-2">
            {alerts.map((a, i) => (
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
        </section>
      )}

      <MetricGrid
        items={[
          { label: "Потребители", value: String(data.users.totalUsers) },
          { label: "Онлайн", value: String(data.users.onlineUsers) },
          { label: "Чакащи репорти", value: String(data.reports.pendingReports) },
          {
            label: "Strikes ≥2",
            value: String(data.strikes.withTwoStrikes + data.strikes.withThreeOrMore),
          },
          { label: "Абонати", value: String(data.subscriptions.total ?? 0) },
          { label: "Активност (1ч)", value: String(data.activity.lastHour ?? 0) },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-[var(--radius-lg)] border border-border-default/60 p-4">
          <h3 className="mb-2 font-semibold">Бързи връзки</h3>
          <div className="flex flex-wrap gap-2 text-sm">
            <QuickLink href="/admin?tab=reports" label="Репорти" />
            <QuickLink href="/admin?tab=inbox" label="Inbox" />
            <QuickLink href="/admin?tab=users" label="Потребители" />
            <QuickLink href="/admin?tab=podcast" label="Подкаст" />
            <QuickLink href="/admin?tab=events" label="Събития" />
            <QuickLink href="/admin?tab=health" label="Здраве" />
          </div>
        </section>
        <section className="rounded-[var(--radius-lg)] border border-border-default/60 p-4">
          <h3 className="mb-2 font-semibold">Съдържание</h3>
          <ul className="space-y-1 text-sm text-[color:var(--color-text-secondary)]">
            <li>Публикации: {data.content.publications}</li>
            <li>Сигнали: {data.content.signals}</li>
            <li>Епизоди: {data.content.podcastEpisodes}</li>
            <li className="flex items-center gap-2">
              Системно здраве:{" "}
              <StatusPill
                status={
                  alerts.some((a) => a.level === "critical")
                    ? "DOWN"
                    : alerts.some((a) => a.level === "warning")
                      ? "WARNING"
                      : "UP"
                }
              />
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-[var(--radius-md)] bg-[color:var(--color-surface-muted)] px-3 py-1.5 hover:bg-primary/10"
    >
      {label}
    </Link>
  );
}
