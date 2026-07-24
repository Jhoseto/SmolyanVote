"use client";

import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ErrorState, Skeleton } from "@/shared/ui";
import { useToast } from "@/shared/hooks/useToast";
import { useConfirm } from "@/shared/hooks/useConfirm";
import { errorMessage } from "@/shared/lib/errorMessage";
import { formatRelativeDate } from "@/shared/lib/formatRelativeDate";
import { adminApi } from "../api";
import type { GroupedReport, ReportDetail } from "../types";
import { MetricGrid } from "./MetricGrid";
import { entityPreviewHref } from "../lib/entityPreviewHref";

export function ReportsPanel({ enabled }: { enabled: boolean }) {
  const toast = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [pendingOnly, setPendingOnly] = useState(false);
  const [entityTypeFilter, setEntityTypeFilter] = useState("ALL");
  const [sorting, setSorting] = useState<SortingState>([{ id: "reportCount", desc: true }]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [reporters, setReporters] = useState<{
    entityType: string;
    entityId: number;
    entityLabel?: string | null;
    items: ReportDetail[];
  } | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewStatus, setReviewStatus] = useState<string | null>(null);

  const statsQ = useQuery({
    queryKey: ["admin", "report-stats"],
    queryFn: () => adminApi.reportStatistics(),
    enabled,
  });

  const reportsQ = useQuery({
    queryKey: ["admin", "reports", page, pendingOnly, entityTypeFilter],
    queryFn: () =>
      adminApi.groupedReports({
        page,
        size: 50,
        pendingOnly,
        entityType: entityTypeFilter,
      }),
    enabled,
  });

  const entityActionMut = useMutation({
    mutationFn: (params: {
      entityType: string;
      entityId: number;
      action: "DELETE" | "DISMISS";
      banAuthor?: boolean;
    }) => adminApi.entityAction(params),
    onSuccess: () => {
      toast.success("Действието е изпълнено");
      invalidate();
    },
    onError: (e) => toast.error(errorMessage(e, "Действието не успя")),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "report-stats"] });
  };

  const columns = useMemo<ColumnDef<GroupedReport>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
      },
      {
        accessorKey: "entityType",
        header: "Тип",
      },
      {
        id: "entityLabel",
        header: "Обект",
        cell: ({ row }) => row.original.entityLabel || "—",
      },
      {
        accessorKey: "entityId",
        header: "ID",
        cell: ({ row }) => {
          const href = entityPreviewHref(
            row.original.entityType,
            row.original.entityId,
            row.original.entityLabel,
          );
          return href ? (
            <a href={href} target="_blank" rel="noreferrer" className="text-primary underline">
              #{row.original.entityId}
            </a>
          ) : (
            `#${row.original.entityId}`
          );
        },
      },
      { accessorKey: "reportCount", header: "Брой" },
      { accessorKey: "mostCommonReason", header: "Причина" },
      { accessorKey: "status", header: "Статус" },
      {
        accessorKey: "lastReportDate",
        header: "Последен",
        cell: ({ getValue }) => {
          const v = getValue() as string | null;
          return v ? formatRelativeDate(v) : "—";
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="text-xs text-primary underline"
              onClick={() => void openReporters(row.original)}
            >
              Репортери
            </button>
            <button
              type="button"
              className="text-xs text-red-600 underline"
              disabled={entityActionMut.isPending}
              onClick={async () => {
                const ok = await confirm({
                  title: "Изтриване",
                  description: "Изтрий съдържанието и маркирай репортите като решени?",
                  confirmText: "Изтрий",
                  destructive: true,
                });
                if (!ok) return;
                entityActionMut.mutate({
                  entityType: row.original.entityType,
                  entityId: row.original.entityId,
                  action: "DELETE",
                });
              }}
            >
              Изтрий
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entityActionMut.isPending],
  );

  async function openReporters(g: GroupedReport) {
    try {
      const items = await adminApi.entityReports(g.entityType, g.entityId);
      setReporters({
        entityType: g.entityType,
        entityId: g.entityId,
        entityLabel: g.entityLabel,
        items,
      });
    } catch (e) {
      toast.error(errorMessage(e, "Репортерите не можаха да се заредят"));
    }
  }

  async function reviewSingleReport(reportId: number, status: string, notes?: string) {
    try {
      await adminApi.reviewReport(reportId, { status, adminNotes: notes });
      toast.success("Репортът е обновен");
      if (reporters) {
        const items = await adminApi.entityReports(reporters.entityType, reporters.entityId);
        setReporters({ ...reporters, items });
      }
      invalidate();
    } catch (e) {
      toast.error(errorMessage(e, "Прегледът не успя"));
    }
  }

  const table = useReactTable({
    data: reportsQ.data?.content ?? [],
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (r) => `${r.entityType}-${r.entityId}`,
    manualPagination: true,
    pageCount: reportsQ.data?.totalPages ?? 0,
  });

  const selected = table.getSelectedRowModel().rows.map((r) => r.original);

  const reviewMut = useMutation({
    mutationFn: ({ status, adminNotes }: { status: string; adminNotes?: string }) =>
      adminApi.bulkReview({
        entityGroups: selected.map((s) => ({
          entityType: s.entityType,
          entityId: s.entityId,
        })),
        status,
        adminNotes: adminNotes?.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Прегледът е записан");
      setRowSelection({});
      setReviewStatus(null);
      setReviewNotes("");
      invalidate();
    },
    onError: (e) => toast.error(errorMessage(e, "Bulk review не успя")),
  });

  function openBulkReview(status: string) {
    setReviewStatus(status);
    setReviewNotes("");
  }

  async function bulkDelete() {
    const ids = selected.flatMap((s) => s.reportIds ?? []);
    if (ids.length === 0) return;
    const ok = await confirm({
      title: "Изтриване на репорти",
      description: `Изтриване на ${ids.length} репорта?`,
      confirmText: "Изтрий",
      destructive: true,
    });
    if (!ok) return;
    try {
      await adminApi.bulkDeleteReports(ids);
      toast.success("Изтрити");
      setRowSelection({});
      invalidate();
    } catch (e) {
      toast.error(errorMessage(e, "Изтриването не успя"));
    }
  }

  if (reportsQ.isPending) return <Skeleton className="h-96 w-full rounded-[var(--radius-lg)]" />;
  if (reportsQ.isError) {
    return (
      <ErrorState description="Репортите не можаха да се заредят." onRetry={() => reportsQ.refetch()} />
    );
  }

  const stats = statsQ.data;

  return (
    <div className="flex flex-col gap-4">
      {stats && (
        <MetricGrid
          items={[
            { label: "Общо", value: String(stats.totalReports ?? 0) },
            { label: "Чакащи", value: String(stats.pendingReports ?? 0), tone: "warn" },
            { label: "Скорошни", value: String(stats.recentReports ?? 0) },
          ]}
        />
      )}

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2">
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
        <select
          value={entityTypeFilter}
          onChange={(e) => {
            setEntityTypeFilter(e.target.value);
            setPage(0);
          }}
          className="rounded border px-2 py-1"
        >
          <option value="ALL">Всички типове</option>
          <option value="PUBLICATION">Публикации</option>
          <option value="SIGNAL">Сигнали</option>
          <option value="COMMENT">Коментари</option>
          <option value="USER">Потребители</option>
        </select>
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openBulkReview("REVIEWED")}
            className="rounded bg-primary px-3 py-1.5 text-xs text-white"
          >
            Маркирай прегледани ({selected.length})
          </button>
          <button
            type="button"
            onClick={() => openBulkReview("DISMISSED")}
            className="rounded border px-3 py-1.5 text-xs"
          >
            Отхвърли
          </button>
          <button
            type="button"
            onClick={() => openBulkReview("RESOLVED")}
            className="rounded border px-3 py-1.5 text-xs"
          >
            Решени
          </button>
          <button
            type="button"
            onClick={() => void bulkDelete()}
            className="rounded bg-[color:var(--color-error)] px-3 py-1.5 text-xs text-white"
          >
            Изтрий репорти
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border-default/60">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-[color:var(--color-surface-muted)] text-xs uppercase text-[color:var(--color-text-muted)]">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className="cursor-pointer px-3 py-2"
                    onClick={h.column.getToggleSortingHandler()}
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t border-border-default/40 hover:bg-primary-50/40">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span>
          Стр. {page + 1}/{reportsQ.data?.totalPages || 1} · {reportsQ.data?.totalElements ?? 0} групи
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="rounded border px-2 py-1 disabled:opacity-40"
          >
            Назад
          </button>
          <button
            type="button"
            disabled={reportsQ.data?.last}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border px-2 py-1 disabled:opacity-40"
          >
            Напред
          </button>
        </div>
      </div>

      {reporters && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-[var(--radius-lg)] bg-white p-5">
            <div className="mb-3 flex justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold">
                  Репортери · {reporters.entityType} #{reporters.entityId}
                </h3>
                {reporters.entityLabel && (
                  <p className="text-xs text-[color:var(--color-text-muted)]">{reporters.entityLabel}</p>
                )}
              </div>
              <button type="button" onClick={() => setReporters(null)}>
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <ul className="space-y-2 text-sm">
              {reporters.items.map((r) => (
                <li key={r.id} className="rounded bg-[color:var(--color-surface-muted)] px-3 py-2">
                  <p className="font-medium">
                    {r.reporterUsername} · {String(r.reason)}
                  </p>
                  <p className="text-xs text-[color:var(--color-text-muted)]">{r.description}</p>
                  <p className="text-[11px] text-[color:var(--color-text-muted)]">
                    {r.status}
                    {r.createdAt ? ` · ${formatRelativeDate(r.createdAt)}` : ""}
                  </p>
                  {r.adminNotes && (
                    <p className="mt-1 text-[11px] italic text-[color:var(--color-text-secondary)]">
                      Admin: {r.adminNotes}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(["REVIEWED", "DISMISSED", "RESOLVED"] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => void reviewSingleReport(r.id, st)}
                        className="rounded border px-2 py-0.5 text-[10px] hover:bg-white"
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {reviewStatus && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-[var(--radius-lg)] bg-white p-5">
            <h3 className="text-sm font-bold">Bulk review · {reviewStatus}</h3>
            <p className="mt-1 text-xs text-[color:var(--color-text-muted)]">
              {selected.length} групи · {selected.reduce((n, s) => n + (s.reportIds?.length ?? 0), 0)} репорта
            </p>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Admin бележки (по избор)…"
              rows={3}
              className="mt-3 w-full rounded border px-2 py-1.5 text-sm"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReviewStatus(null)}
                className="rounded border px-3 py-1.5 text-xs"
              >
                Отказ
              </button>
              <button
                type="button"
                disabled={reviewMut.isPending}
                onClick={() =>
                  reviewMut.mutate({ status: reviewStatus, adminNotes: reviewNotes || undefined })
                }
                className="rounded bg-primary px-3 py-1.5 text-xs text-white disabled:opacity-50"
              >
                Потвърди
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
