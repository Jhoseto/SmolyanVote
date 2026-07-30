"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useToast } from "@/shared/hooks/useToast";
import { errorMessage } from "@/shared/lib/errorMessage";
import { adminMonitorApi } from "../../api/monitorAdmin";
import type { MonitorAdminCompany, MonitorCompanyUpdateRequest } from "../../types";

function fmtMoney(v: number | null): string {
  if (v === null || v === undefined) return "—";
  return new Intl.NumberFormat("bg-BG", { maximumFractionDigits: 0 }).format(v) + " €";
}

export function MonitorCompaniesTab({ enabled }: { enabled: boolean }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<MonitorAdminCompany | null>(null);

  const companiesQ = useQuery({
    queryKey: ["admin", "monitor", "companies", search, page],
    queryFn: () => adminMonitorApi.searchCompanies(search, page, 25),
    enabled,
  });

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["admin", "monitor", "companies"] });

  const deleteMut = useMutation({
    mutationFn: (id: number) => adminMonitorApi.deleteCompany(id),
    onSuccess: () => {
      toast.success("Фирмата е изтрита");
      invalidate();
    },
    onError: (e) => toast.error(errorMessage(e, "Изтриването неуспешно")),
  });

  const updateMut = useMutation({
    mutationFn: (vars: { id: number; body: MonitorCompanyUpdateRequest }) =>
      adminMonitorApi.updateCompany(vars.id, vars.body),
    onSuccess: () => {
      toast.success("Фирмата е обновена");
      invalidate();
      setEditing(null);
    },
    onError: (e) => toast.error(errorMessage(e, "Обновяването неуспешно")),
  });

  const enrichMut = useMutation({
    mutationFn: (eik: string) => adminMonitorApi.enrichCompanyOne(eik),
    onSuccess: () => {
      toast.success("Данните от Търговски регистър са обновени");
      invalidate();
    },
    onError: (e) => toast.error(errorMessage(e, "Enrich неуспешен")),
  });

  function confirmDelete(c: MonitorAdminCompany) {
    if (window.confirm(`Изтриване на фирма "${c.name}"? Действието е безвъзвратно.`)) {
      deleteMut.mutate(c.id);
    }
  }

  const data = companiesQ.data;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-text-muted)]" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Търси по име или ЕИК…"
            className="w-full rounded-full border border-border-default/50 py-2 pl-9 pr-3 text-[0.85rem]"
          />
        </div>
        <span className="text-[0.78rem] text-[color:var(--color-text-muted)]">
          {data ? `${data.totalElements} фирми` : ""}
        </span>
      </div>

      {companiesQ.isLoading ? (
        <Skeleton className="h-64 w-full rounded-[var(--radius-lg)]" />
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border-default/35">
          <table className="w-full min-w-[860px] text-left text-[0.82rem]">
            <thead className="bg-[color:var(--color-surface-muted)] text-[0.72rem] uppercase tracking-wide text-[color:var(--color-text-muted)]">
              <tr>
                <th className="px-3 py-2">Име</th>
                <th className="px-3 py-2">ЕИК</th>
                <th className="px-3 py-2">Договори</th>
                <th className="px-3 py-2">Спечелено</th>
                <th className="px-3 py-2">CRI</th>
                <th className="px-3 py-2">Правна форма</th>
                <th className="px-3 py-2 text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {(data?.content ?? []).map((c) => (
                <tr key={c.id} className="border-t border-border-default/25">
                  <td className="max-w-[220px] px-3 py-2">
                    <p className="line-clamp-2 font-medium">{c.name}</p>
                    {c.consortium && (
                      <span className="text-[0.68rem] text-[color:var(--color-text-muted)]">Консорциум</span>
                    )}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-[color:var(--color-text-muted)]">{c.eik}</td>
                  <td className="px-3 py-2 tabular-nums">{c.contractCount ?? 0}</td>
                  <td className="px-3 py-2 tabular-nums">{fmtMoney(c.totalWonEur)}</td>
                  <td className="px-3 py-2">
                    {c.compositeRiskScore != null ? (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[0.68rem] font-semibold",
                          c.compositeRiskScore >= 40 ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-700",
                        )}
                      >
                        {c.compositeRiskScore}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2 text-[color:var(--color-text-secondary)]">{c.legalForm ?? "—"}</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1.5">
                      <IconButton
                        icon="bi-building-check"
                        title="Enrich от Търговски регистър"
                        onClick={() => enrichMut.mutate(c.eik)}
                        disabled={enrichMut.isPending}
                      />
                      <IconButton icon="bi-pencil" title="Редактирай" onClick={() => setEditing(c)} />
                      <IconButton icon="bi-trash" title="Изтрий" danger onClick={() => confirmDelete(c)} />
                    </div>
                  </td>
                </tr>
              ))}
              {(data?.content ?? []).length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-[color:var(--color-text-muted)]">
                    Няма фирми
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={data.first}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="rounded-full border border-border-default/40 px-3 py-1.5 text-[0.8rem] disabled:opacity-40"
          >
            ← Предишна
          </button>
          <span className="text-[0.8rem] text-[color:var(--color-text-muted)]">
            {data.number + 1} / {data.totalPages}
          </span>
          <button
            type="button"
            disabled={data.last}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-full border border-border-default/40 px-3 py-1.5 text-[0.8rem] disabled:opacity-40"
          >
            Следваща →
          </button>
        </div>
      )}

      {editing && (
        <CompanyEditModal
          company={editing}
          saving={updateMut.isPending}
          onClose={() => setEditing(null)}
          onSave={(body) => updateMut.mutate({ id: editing.id, body })}
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
  disabled,
}: {
  icon: string;
  title: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] border text-[color:var(--color-text-secondary)] disabled:opacity-40",
        danger ? "border-red-200 hover:bg-red-50 hover:text-red-700" : "border-border-default/40 hover:bg-primary-50 hover:text-primary",
      )}
    >
      <i className={cn("bi", icon)} />
    </button>
  );
}

function CompanyEditModal({
  company,
  onClose,
  onSave,
  saving,
}: {
  company: MonitorAdminCompany;
  onClose: () => void;
  onSave: (body: MonitorCompanyUpdateRequest) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<MonitorCompanyUpdateRequest>({
    name: company.name,
    consortium: company.consortium,
    legalForm: company.legalForm,
    registeredAddress: company.registeredAddress,
    managersSummary: company.managersSummary,
  });

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-[var(--radius-lg)] bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="font-display text-[0.95rem] font-semibold">Редакция на {company.eik}</h4>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-black/[0.05]">
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className="grid gap-3 overflow-y-auto px-4 py-4">
          <Field label="Име">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded border border-border-default/50 px-2 py-1.5 text-[0.85rem]"
            />
          </Field>
          <Field label="Правна форма">
            <input
              value={form.legalForm ?? ""}
              onChange={(e) => setForm({ ...form, legalForm: e.target.value })}
              className="w-full rounded border border-border-default/50 px-2 py-1.5 text-[0.85rem]"
            />
          </Field>
          <Field label="Адрес на регистрация">
            <input
              value={form.registeredAddress ?? ""}
              onChange={(e) => setForm({ ...form, registeredAddress: e.target.value })}
              className="w-full rounded border border-border-default/50 px-2 py-1.5 text-[0.85rem]"
            />
          </Field>
          <Field label="Управители (резюме)">
            <textarea
              value={form.managersSummary ?? ""}
              onChange={(e) => setForm({ ...form, managersSummary: e.target.value })}
              rows={2}
              className="w-full rounded border border-border-default/50 px-2 py-1.5 text-[0.85rem]"
            />
          </Field>
          <label className="flex items-center gap-2 text-[0.82rem]">
            <input
              type="checkbox"
              checked={form.consortium}
              onChange={(e) => setForm({ ...form, consortium: e.target.checked })}
            />
            Консорциум / обединение
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t px-4 py-3">
          <button type="button" onClick={onClose} className="rounded-full border px-4 py-2 text-[0.85rem]">
            Отказ
          </button>
          <button
            type="button"
            disabled={saving}
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
