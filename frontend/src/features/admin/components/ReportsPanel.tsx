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

function entityPreviewHref(entityType: string, entityId: number): string | null {
  const t = entityType.toUpperCase();
  if (t.includes("SIMPLE") || t === "EVENT") return `/event/${entityId}`;
  if (t.includes("REFERENDUM")) return `/referendum/${entityId}`;
  if (t.includes("MULTI")) return `/multipoll/${entityId}`;
  if (t.includes("PUBLICATION") || t.includes("POST")) return `/publications?highlight=${entityId}`;
  if (t.includes("SIGNAL")) return `/signals?openSignal=${entityId}`;
  if (t.includes("USER")) return `/user/id-${entityId}`;
  return null;
}

export function ReportsPanel({ enabled }: { enabled: boolean }) {
  const toast = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [sorting, setSorting] = useState<SortingState>([{ id: "reportCount", desc: true }]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [reporters, setReporters] = useState<{
    entityType: string;
    entityId: number;
    items: ReportDetail[];
  } | null>(null);

  const statsQ = useQuery({
    queryKey: ["admin", "report-stats"],
    queryFn: () => adminApi.reportStatistics(),
    enabled,
  });

  const reportsQ = useQuery({
    queryKey: ["admin", "reports", page],
    queryFn: () => adminApi.groupedReports(page, 50),
    enabled,
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
        accessorKey: "entityId",
        header: "ID",
        cell: ({ row }) => {
          const href = entityPreviewHref(row.original.entityType, row.original.entityId);
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
          <button
            type="button"
            className="text-xs text-primary underline"
            onClick={() => void openReporters(row.original)}
          >
            Репортери
          </button>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  async function openReporters(g: GroupedReport) {
    try {
      const items = await adminApi.entityReports(g.entityType, g.entityId);
      setReporters({ entityType: g.entityType, entityId: g.entityId, items });
    } catch (e) {
      toast.error(errorMessage(e, "Репортерите не можаха да се заредят"));
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
    mutationFn: (status: string) =>
      adminApi.bulkReview({
        entityGroups: selected.map((s) => ({
          entityType: s.entityType,
          entityId: s.entityId,
        })),
        status,
        adminNotes: `Bulk ${status}`,
      }),
    onSuccess: () => {
      toast.success("Прегледът е записан");
      setRowSelection({});
      invalidate();
    },
    onError: (e) => toast.error(errorMessage(e, "Bulk review не успя")),
  });

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

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => reviewMut.mutate("REVIEWED")}
            className="rounded bg-primary px-3 py-1.5 text-xs text-white"
          >
            Маркирай прегледани ({selected.length})
          </button>
          <button
            type="button"
            onClick={() => reviewMut.mutate("DISMISSED")}
            className="rounded border px-3 py-1.5 text-xs"
          >
            Отхвърли
          </button>
          <button
            type="button"
            onClick={() => reviewMut.mutate("RESOLVED")}
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
            <div className="mb-3 flex justify-between">
              <h3 className="text-sm font-bold">
                Репортери · {reporters.entityType} #{reporters.entityId}
              </h3>
              <button type="button" onClick={() => setReporters(null)}>
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <ul className="space-y-2 text-sm">
              {reporters.items.map((r) => (
                <li key={r.id} className="rounded bg-[color:var(--color-surface-muted)] px-3 py-2">
                  <p className="font-medium">
                    {r.reporterUsername} · {r.reason}
                  </p>
                  <p className="text-xs text-[color:var(--color-text-muted)]">{r.description}</p>
                  <p className="text-[11px] text-[color:var(--color-text-muted)]">
                    {r.status}
                    {r.createdAt ? ` · ${formatRelativeDate(r.createdAt)}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
