"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useToast } from "@/shared/hooks/useToast";
import { errorMessage } from "@/shared/lib/errorMessage";
import { adminMonitorApi } from "../../api/monitorAdmin";
import type { MonitorBudgetLine, MonitorBudgetLineRequest } from "../../types";

function fmtMoney(v: number): string {
  return new Intl.NumberFormat("bg-BG", { maximumFractionDigits: 0 }).format(v) + " €";
}

export function MonitorBudgetTab({ enabled }: { enabled: boolean }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<MonitorBudgetLine | null>(null);
  const [creating, setCreating] = useState(false);

  const linesQ = useQuery({
    queryKey: ["admin", "monitor", "budget-lines"],
    queryFn: () => adminMonitorApi.listBudgetLines(),
    enabled,
  });

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["admin", "monitor", "budget-lines"] });

  const createMut = useMutation({
    mutationFn: (body: MonitorBudgetLineRequest) => adminMonitorApi.createBudgetLine(body),
    onSuccess: () => {
      toast.success("Редът е добавен");
      invalidate();
      setCreating(false);
    },
    onError: (e) => toast.error(errorMessage(e, "Добавянето неуспешно")),
  });

  const updateMut = useMutation({
    mutationFn: (vars: { id: number; body: MonitorBudgetLineRequest }) =>
      adminMonitorApi.updateBudgetLine(vars.id, vars.body),
    onSuccess: () => {
      toast.success("Редът е обновен");
      invalidate();
      setEditing(null);
    },
    onError: (e) => toast.error(errorMessage(e, "Обновяването неуспешно")),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => adminMonitorApi.deleteBudgetLine(id),
    onSuccess: () => {
      toast.success("Редът е изтрит");
      invalidate();
    },
    onError: (e) => toast.error(errorMessage(e, "Изтриването неуспешно")),
  });

  function confirmDelete(l: MonitorBudgetLine) {
    if (window.confirm(`Изтриване на бюджетен ред "${l.label}"?`)) {
      deleteMut.mutate(l.id);
    }
  }

  const lines = linesQ.data ?? [];
  const totalPlanned = lines.reduce((s, l) => s + l.plannedEur, 0);
  const totalExecuted = lines.reduce((s, l) => s + l.executedEur, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-[0.95rem] font-semibold">Планиран бюджет — Община Смолян</h3>
          <p className="text-[0.78rem] text-[color:var(--color-text-secondary)]">
            Изпълнението се смята автоматично от подписаните договори; тук се редактира само планът.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="rounded-full bg-primary px-4 py-2 text-[0.8rem] font-medium text-white"
        >
          <i className="bi bi-plus-lg mr-1" />
          Нов ред
        </button>
      </div>

      {linesQ.isLoading ? (
        <Skeleton className="h-64 w-full rounded-[var(--radius-lg)]" />
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border-default/35">
          <table className="w-full min-w-[720px] text-left text-[0.82rem]">
            <thead className="bg-[color:var(--color-surface-muted)] text-[0.72rem] uppercase tracking-wide text-[color:var(--color-text-muted)]">
              <tr>
                <th className="px-3 py-2">Категория</th>
                <th className="px-3 py-2">План</th>
                <th className="px-3 py-2">Изпълнено</th>
                <th className="px-3 py-2">%</th>
                <th className="px-3 py-2 text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => {
                const pct = l.plannedEur > 0 ? Math.round((l.executedEur / l.plannedEur) * 100) : 0;
                return (
                  <tr key={l.id} className="border-t border-border-default/25">
                    <td className="px-3 py-2 font-medium">
                      {l.label}
                      <span className="ml-2 text-[0.68rem] text-[color:var(--color-text-muted)]">{l.categoryKey}</span>
                    </td>
                    <td className="px-3 py-2 tabular-nums">{fmtMoney(l.plannedEur)}</td>
                    <td className="px-3 py-2 tabular-nums">{fmtMoney(l.executedEur)}</td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[0.68rem] font-semibold",
                          pct >= 90 ? "bg-emerald-100 text-emerald-800" : pct >= 40 ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-700",
                        )}
                      >
                        {pct}%
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-1.5">
                        <IconButton icon="bi-pencil" title="Редактирай" onClick={() => setEditing(l)} />
                        <IconButton icon="bi-trash" title="Изтрий" danger onClick={() => confirmDelete(l)} />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {lines.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-[color:var(--color-text-muted)]">
                    Няма бюджетни редове
                  </td>
                </tr>
              )}
            </tbody>
            {lines.length > 0 && (
              <tfoot>
                <tr className="border-t border-border-default/40 font-semibold">
                  <td className="px-3 py-2">Общо</td>
                  <td className="px-3 py-2 tabular-nums">{fmtMoney(totalPlanned)}</td>
                  <td className="px-3 py-2 tabular-nums">{fmtMoney(totalExecuted)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {(editing || creating) && (
        <BudgetLineEditModal
          initial={editing}
          saving={createMut.isPending || updateMut.isPending}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSave={(body) => {
            if (editing) {
              updateMut.mutate({ id: editing.id, body });
            } else {
              createMut.mutate(body);
            }
          }}
        />
      )}
    </div>
  );
}

function IconButton({
  icon,
  title,
  onClick,
  danger,
}: {
  icon: string;
  title: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] border text-[color:var(--color-text-secondary)]",
        danger ? "border-red-200 hover:bg-red-50 hover:text-red-700" : "border-border-default/40 hover:bg-primary-50 hover:text-primary",
      )}
    >
      <i className={cn("bi", icon)} />
    </button>
  );
}

function BudgetLineEditModal({
  initial,
  onClose,
  onSave,
  saving,
}: {
  initial: MonitorBudgetLine | null;
  onClose: () => void;
  onSave: (body: MonitorBudgetLineRequest) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<MonitorBudgetLineRequest>(
    initial
      ? {
          categoryKey: initial.categoryKey,
          label: initial.label,
          plannedEur: initial.plannedEur,
          cpvPrefix: initial.cpvPrefix,
          budgetYear: initial.budgetYear,
          sortOrder: initial.sortOrder,
        }
      : { categoryKey: "", label: "", plannedEur: 0, cpvPrefix: null },
  );

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-[var(--radius-lg)] bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="font-display text-[0.95rem] font-semibold">
            {initial ? `Редакция на "${initial.label}"` : "Нов бюджетен ред"}
          </h4>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-black/[0.05]">
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className="grid gap-3 overflow-y-auto px-4 py-4">
          <Field label="Категория (ключ, латиница, без интервали)">
            <input
              value={form.categoryKey}
              disabled={!!initial}
              onChange={(e) => setForm({ ...form, categoryKey: e.target.value })}
              className="w-full rounded border border-border-default/50 px-2 py-1.5 text-[0.85rem] disabled:opacity-60"
            />
          </Field>
          <Field label="Етикет">
            <input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="w-full rounded border border-border-default/50 px-2 py-1.5 text-[0.85rem]"
            />
          </Field>
          <Field label="Планирана сума (EUR)">
            <input
              type="number"
              value={form.plannedEur}
              onChange={(e) => setForm({ ...form, plannedEur: Number(e.target.value) })}
              className="w-full rounded border border-border-default/50 px-2 py-1.5 text-[0.85rem]"
            />
          </Field>
          <Field label="CPV префикс (за автоматично изпълнение, напр. 45)">
            <input
              value={form.cpvPrefix ?? ""}
              onChange={(e) => setForm({ ...form, cpvPrefix: e.target.value || null })}
              className="w-full rounded border border-border-default/50 px-2 py-1.5 text-[0.85rem]"
            />
          </Field>
        </div>
        <div className="flex justify-end gap-2 border-t px-4 py-3">
          <button type="button" onClick={onClose} className="rounded-full border px-4 py-2 text-[0.85rem]">
            Отказ
          </button>
          <button
            type="button"
            disabled={saving || !form.label.trim() || !form.categoryKey.trim()}
            onClick={() => onSave(form)}
            className="rounded-full bg-primary px-4 py-2 text-[0.85rem] font-medium text-white disabled:opacity-50"
          >
            {saving ? "Запазване…" : "Запази"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-[0.78rem] text-[color:var(--color-text-secondary)]">
      {label}
      {children}
    </label>
  );
}
