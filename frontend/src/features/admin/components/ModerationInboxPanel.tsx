"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ErrorState, Skeleton } from "@/shared/ui";
import { useToast } from "@/shared/hooks/useToast";
import { useConfirm } from "@/shared/hooks/useConfirm";
import { errorMessage } from "@/shared/lib/errorMessage";
import { formatRelativeDate } from "@/shared/lib/formatRelativeDate";
import { adminApi } from "../api";
import { entityPreviewHref } from "../lib/entityPreviewHref";
import type { ModerationInboxItem } from "../types";

const ENTITY_FILTERS = [
  { id: "ALL", label: "Всички" },
  { id: "PUBLICATION", label: "Публикации" },
  { id: "SIGNAL", label: "Сигнали" },
  { id: "COMMENT", label: "Коментари" },
  { id: "USER", label: "Потребители" },
];

export function ModerationInboxPanel({ enabled }: { enabled: boolean }) {
  const toast = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [entityType, setEntityType] = useState("ALL");
  const [pendingOnly, setPendingOnly] = useState(true);

  const inboxQ = useQuery({
    queryKey: ["admin", "inbox", page, entityType, pendingOnly],
    queryFn: () =>
      adminApi.moderationInbox({
        page,
        size: 20,
        entityType,
        pendingOnly,
      }),
    enabled,
  });

  const actionMut = useMutation({
    mutationFn: (params: {
      item: ModerationInboxItem;
      action: "DELETE" | "DISMISS" | "RESOLVE_SIGNAL";
      banAuthor?: boolean;
    }) =>
      adminApi.entityAction({
        entityType: params.item.entityType,
        entityId: params.item.entityId,
        action: params.action,
        banAuthor: params.banAuthor,
        banReason: "Модерация от inbox",
      }),
    onSuccess: () => {
      toast.success("Действието е изпълнено");
      queryClient.invalidateQueries({ queryKey: ["admin", "inbox"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
    },
    onError: (e) => toast.error(errorMessage(e, "Действието не успя")),
  });

  const items = inboxQ.data?.items ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={entityType}
          onChange={(e) => {
            setEntityType(e.target.value);
            setPage(0);
          }}
          className="rounded-[var(--radius-md)] border border-border-default/60 px-3 py-2 text-sm"
        >
          {ENTITY_FILTERS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={pendingOnly}
            onChange={(e) => {
              setPendingOnly(e.target.checked);
              setPage(0);
            }}
          />
          Само чакащи
        </label>
      </div>

      {inboxQ.isLoading && <Skeleton className="h-64 w-full rounded-[var(--radius-lg)]" />}
      {inboxQ.isError && (
        <ErrorState description="Inbox недостъпен" onRetry={() => inboxQ.refetch()} />
      )}

      {!inboxQ.isLoading && items.length === 0 && (
        <p className="text-sm text-[color:var(--color-text-secondary)]">Няма елементи в опашката.</p>
      )}

      <ul className="flex flex-col gap-3">
        {items.map((item) => {
          const preview = entityPreviewHref(item.entityType, item.entityId, item.entityLabel);
          return (
            <li
              key={`${item.entityType}-${item.entityId}`}
              className="rounded-[var(--radius-lg)] border border-border-default/60 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {item.entityLabel ?? `${item.entityType} #${item.entityId}`}
                  </p>
                  <p className="text-xs text-[color:var(--color-text-secondary)]">
                    {item.entityType} · {item.reportCount} репорта · {item.status} ·{" "}
                    {item.lastReportDate ? formatRelativeDate(item.lastReportDate) : "—"}
                  </p>
                  {item.preview && (
                    <p className="mt-1 text-sm text-[color:var(--color-text-secondary)] line-clamp-2">
                      {item.preview}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {preview && (
                    <Link
                      href={preview}
                      className="rounded-[var(--radius-md)] border px-3 py-1.5 text-sm"
                    >
                      Преглед
                    </Link>
                  )}
                  {item.entityType === "SIGNAL" && (
                    <button
                      type="button"
                      className="rounded-[var(--radius-md)] bg-emerald-600 px-3 py-1.5 text-sm text-white"
                      disabled={actionMut.isPending}
                      onClick={() =>
                        actionMut.mutate({ item, action: "RESOLVE_SIGNAL" })
                      }
                    >
                      Решен
                    </button>
                  )}
                  <button
                    type="button"
                    className="rounded-[var(--radius-md)] border px-3 py-1.5 text-sm"
                    disabled={actionMut.isPending}
                    onClick={() => actionMut.mutate({ item, action: "DISMISS" })}
                  >
                    Отхвърли
                  </button>
                  <button
                    type="button"
                    className="rounded-[var(--radius-md)] bg-red-600 px-3 py-1.5 text-sm text-white"
                    disabled={actionMut.isPending}
                    onClick={async () => {
                      const ok = await confirm({
                        title: "Изтриване на съдържание",
                        description: "Сигурни ли сте? Може да баннете автора.",
                        confirmText: "Изтрий",
                        destructive: true,
                      });
                      if (!ok) return;
                      const ban = await confirm({
                        title: "Бан на автора?",
                        description: "Да се банне авторът за 7 дни?",
                        confirmText: "Бан",
                        destructive: true,
                      });
                      actionMut.mutate({ item, action: "DELETE", banAuthor: ban });
                    }}
                  >
                    Изтрий
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {inboxQ.data && inboxQ.data.totalPages > 1 && (
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
            {page + 1} / {inboxQ.data.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= inboxQ.data.totalPages - 1}
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
