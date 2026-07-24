"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ErrorState, Skeleton } from "@/shared/ui";
import { formatRelativeDate } from "@/shared/lib/formatRelativeDate";
import { publicationsApi } from "@/features/publications/api";
import { adminApi } from "../api";

function entityPreviewHref(
  entityType: string,
  entityId: number,
  entityLabel?: string | null,
): string | null {
  const t = entityType.toUpperCase();
  if (t.includes("PUBLICATION") || t.includes("POST")) return `/publications?openModal=${entityId}`;
  if (t.includes("SIGNAL")) return `/signals?openSignal=${entityId}`;
  if (t.includes("USER") && entityLabel) return `/user/${encodeURIComponent(entityLabel)}`;
  if (t.includes("SIMPLE") || t === "EVENT") return `/event/${entityId}`;
  if (t.includes("REFERENDUM")) return `/referendum/${entityId}`;
  if (t.includes("MULTI")) return `/multipoll/${entityId}`;
  return null;
}

export function ContentPanel({ enabled }: { enabled: boolean }) {
  const pubsQ = useQuery({
    queryKey: ["admin", "content", "publications"],
    queryFn: () => publicationsApi.list({ page: 0, size: 8, sort: "date-desc" }),
    enabled,
  });

  const reportsQ = useQuery({
    queryKey: ["admin", "content", "pending-reports"],
    queryFn: () => adminApi.groupedReports({ page: 0, size: 10, pendingOnly: true }),
    enabled,
  });

  const pendingGroups =
    reportsQ.data?.content?.filter((g) => g.status === "PENDING" || g.status === "REVIEWED") ??
    [];

  if (pubsQ.isPending) return <Skeleton className="h-96 w-full rounded-[var(--radius-lg)]" />;
  if (pubsQ.isError) {
    return (
      <ErrorState description="Съдържанието не можа да се зареди." onRetry={() => pubsQ.refetch()} />
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-display text-lg font-semibold">Бърз достъп</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <QuickLink href="/signals" icon="bi-geo-alt" label="Сигнали (карта)" />
          <QuickLink href="/publications" icon="bi-newspaper" label="Публикации" />
          <QuickLink href="/podcast" icon="bi-mic" label="Подкаст" />
          <QuickLink href="/events" icon="bi-calendar-event" label="Събития" />
        </div>
        <p className="mt-2 text-xs text-[color:var(--color-text-muted)]">
          На картата със сигнали включете „Бърза модерация“ за resolve/delete от popup. При
          публикации и подкаст — admin менюто е на всяка карта.
        </p>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold">Чакащи репорти</h2>
        {reportsQ.isPending ? (
          <Skeleton className="mt-3 h-32 w-full" />
        ) : pendingGroups.length === 0 ? (
          <p className="mt-2 text-sm text-[color:var(--color-text-muted)]">Няма активни групи.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border-default/40 overflow-hidden rounded-[var(--radius-lg)] border border-border-default/60">
            {pendingGroups.slice(0, 8).map((g) => {
              const href = entityPreviewHref(g.entityType, g.entityId, g.entityLabel);
              return (
                <li key={`${g.entityType}-${g.entityId}`} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div>
                    <span className="font-medium">{g.entityType}</span>
                    {g.entityLabel && (
                      <span className="ml-2 text-[color:var(--color-text-muted)]">{g.entityLabel}</span>
                    )}
                    <span className="ml-2 text-xs text-[color:var(--color-text-muted)]">
                      {g.reportCount} репорта · {g.status}
                    </span>
                  </div>
                  {href ? (
                    <Link href={href} className="text-xs text-primary hover:underline">
                      Преглед
                    </Link>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold">Последни публикации</h2>
        <ul className="mt-3 divide-y divide-border-default/40 overflow-hidden rounded-[var(--radius-lg)] border border-border-default/60">
          {(pubsQ.data?.content ?? []).map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{p.title || "Без заглавие"}</p>
                <p className="text-xs text-[color:var(--color-text-muted)]">
                  @{p.authorUsername}
                  {p.createdAt ? ` · ${formatRelativeDate(p.createdAt)}` : ""}
                </p>
              </div>
              <Link
                href={`/publications?openModal=${p.id}`}
                className="shrink-0 text-xs text-primary hover:underline"
              >
                Отвори
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-border-default/60 px-3 py-2 text-sm font-medium hover:bg-[color:var(--color-surface-muted)]"
    >
      <i className={`bi ${icon}`} />
      {label}
    </Link>
  );
}
