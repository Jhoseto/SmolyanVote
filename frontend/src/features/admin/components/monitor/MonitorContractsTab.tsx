"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useToast } from "@/shared/hooks/useToast";
import { errorMessage } from "@/shared/lib/errorMessage";
import { adminMonitorApi } from "../../api/monitorAdmin";
import type { MonitorAdminContract, MonitorContractUpdateRequest } from "../../types";

function fmtMoney(v: number | null): string {
  if (v === null || v === undefined) return "—";
  return new Intl.NumberFormat("bg-BG", { maximumFractionDigits: 0 }).format(v) + " €";
}

export function MonitorContractsTab({ enabled }: { enabled: boolean }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<MonitorAdminContract | null>(null);

  const contractsQ = useQuery({
    queryKey: ["admin", "monitor", "contracts", search, page],
    queryFn: () => adminMonitorApi.searchContracts(search, page, 25),
    enabled,
  });

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["admin", "monitor", "contracts"] });

  const deleteMut = useMutation({
    mutationFn: (id: number) => adminMonitorApi.deleteContract(id),
    onSuccess: () => {
      toast.success("Договорът е изтрит");
      invalidate();
    },
    onError: (e) => toast.error(errorMessage(e, "Изтриването неуспешно")),
  });

  const updateMut = useMutation({
    mutationFn: (vars: { id: number; body: MonitorContractUpdateRequest }) =>
      adminMonitorApi.updateContract(vars.id, vars.body),
    onSuccess: () => {
      toast.success("Договорът е обновен");
      invalidate();
      setEditing(null);
    },
    onError: (e) => toast.error(errorMessage(e, "Обновяването неуспешно")),
  });

  function confirmDelete(c: MonitorAdminContract) {
    if (window.confirm(`Изтриване на договор "${c.subject.slice(0, 60)}"? Действието е безвъзвратно.`)) {
      deleteMut.mutate(c.id);
    }
  }

  const data = contractsQ.data;

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
            placeholder="Търси по предмет или изпълнител…"
            className="w-full rounded-full border border-border-default/50 py-2 pl-9 pr-3 text-[0.85rem]"
          />
        </div>
        <span className="text-[0.78rem] text-[color:var(--color-text-muted)]">
          {data ? `${data.totalElements} договора` : ""}
        </span>
      </div>

      {contractsQ.isLoading ? (
        <Skeleton className="h-64 w-full rounded-[var(--radius-lg)]" />
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border-default/35">
          <table className="w-full min-w-[900px] text-left text-[0.82rem]">
            <thead className="bg-[color:var(--color-surface-muted)] text-[0.72rem] uppercase tracking-wide text-[color:var(--color-text-muted)]">
              <tr>
                <th className="px-3 py-2">Предмет</th>
                <th className="px-3 py-2">Възложител</th>
                <th className="px-3 py-2">Изпълнител</th>
                <th className="px-3 py-2">Сума</th>
                <th className="px-3 py-2">Подписан</th>
                <th className="px-3 py-2">Риск</th>
                <th className="px-3 py-2 text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {(data?.content ?? []).map((c) => (
                <tr key={c.id} className="border-t border-border-default/25">
                  <td className="max-w-[260px] px-3 py-2">
                    <p className="line-clamp-2 font-medium">{c.subject}</p>
                    {c.sourceUrl && (
                      <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[0.72rem] text-primary hover:underline">
                        Оригинал ↗
                      </a>
                    )}
                  </td>
                  <td className="max-w-[180px] px-3 py-2 text-[color:var(--color-text-secondary)]">
                    <p className="line-clamp-2">{c.authorityName ?? c.authorityEik}</p>
                  </td>
                  <td className="max-w-[180px] px-3 py-2 text-[color:var(--color-text-secondary)]">
                    <p className="line-clamp-2">{c.contractorName ?? c.contractorEik ?? "—"}</p>
                  </td>
                  <td className="px-3 py-2 tabular-nums">{fmtMoney(c.amountEur)}</td>
                  <td className="px-3 py-2 tabular-nums text-[color:var(--color-text-muted)]">
                    {c.signedAt ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    {c.riskScore != null ? (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[0.68rem] font-semibold",
                          c.riskScore >= 40 ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-700",
                        )}
                      >
                        {c.riskScore}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1.5">
                      <IconButton icon="bi-pencil" title="Редактирай" onClick={() => setEditing(c)} />
                      <IconButton icon="bi-trash" title="Изтрий" danger onClick={() => confirmDelete(c)} />
                    </div>
                  </td>
                </tr>
              ))}
              {(data?.content ?? []).length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-[color:var(--color-text-muted)]">
                    Няма договори
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
        <ContractEditModal
          contract={editing}
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

function ContractEditModal({
  contract,
  onClose,
  onSave,
  saving,
}: {
  contract: MonitorAdminContract;
  onClose: () => void;
  onSave: (body: MonitorContractUpdateRequest) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<MonitorContractUpdateRequest>({
    subject: contract.subject,
    authorityName: contract.authorityName,
    authorityEik: contract.authorityEik,
    contractorName: contract.contractorName,
    contractorEik: contract.contractorEik,
    sectorCode: contract.sectorCode,
    procedureType: contract.procedureType,
    signedAt: contract.signedAt,
    amountEur: contract.amountEur,
    euFunded: contract.euFunded,
    bidsReceived: contract.bidsReceived,
    sourceUrl: contract.sourceUrl,
  });

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-[var(--radius-lg)] bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="font-display text-[0.95rem] font-semibold">Редакция на договор #{contract.id}</h4>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-black/[0.05]">
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className="grid gap-3 overflow-y-auto px-4 py-4 sm:grid-cols-2">
          <Field label="Предмет" full>
            <textarea
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              rows={3}
              className="w-full rounded border border-border-default/50 px-2 py-1.5 text-[0.85rem]"
            />
          </Field>
          <Field label="Възложител">
            <input
              value={form.authorityName ?? ""}
              onChange={(e) => setForm({ ...form, authorityName: e.target.value })}
              className="w-full rounded border border-border-default/50 px-2 py-1.5 text-[0.85rem]"
            />
          </Field>
          <Field label="ЕИК на възложител">
            <input
              value={form.authorityEik}
              onChange={(e) => setForm({ ...form, authorityEik: e.target.value })}
              className="w-full rounded border border-border-default/50 px-2 py-1.5 text-[0.85rem]"
            />
          </Field>
          <Field label="Изпълнител">
            <input
              value={form.contractorName ?? ""}
              onChange={(e) => setForm({ ...form, contractorName: e.target.value })}
              className="w-full rounded border border-border-default/50 px-2 py-1.5 text-[0.85rem]"
            />
          </Field>
          <Field label="ЕИК на изпълнител">
            <input
              value={form.contractorEik ?? ""}
              onChange={(e) => setForm({ ...form, contractorEik: e.target.value })}
              className="w-full rounded border border-border-default/50 px-2 py-1.5 text-[0.85rem]"
            />
          </Field>
          <Field label="Сума (EUR)">
            <input
              type="number"
              value={form.amountEur ?? ""}
              onChange={(e) => setForm({ ...form, amountEur: e.target.value ? Number(e.target.value) : null })}
              className="w-full rounded border border-border-default/50 px-2 py-1.5 text-[0.85rem]"
            />
          </Field>
          <Field label="Дата на подписване">
            <input
              type="date"
              value={form.signedAt ?? ""}
              onChange={(e) => setForm({ ...form, signedAt: e.target.value || null })}
              className="w-full rounded border border-border-default/50 px-2 py-1.5 text-[0.85rem]"
            />
          </Field>
          <Field label="CPV код">
            <input
              value={form.sectorCode ?? ""}
              onChange={(e) => setForm({ ...form, sectorCode: e.target.value })}
              className="w-full rounded border border-border-default/50 px-2 py-1.5 text-[0.85rem]"
            />
          </Field>
          <Field label="Процедура">
            <input
              value={form.procedureType ?? ""}
              onChange={(e) => setForm({ ...form, procedureType: e.target.value })}
              className="w-full rounded border border-border-default/50 px-2 py-1.5 text-[0.85rem]"
            />
          </Field>
          <Field label="Брой оферти">
            <input
              type="number"
              value={form.bidsReceived ?? ""}
              onChange={(e) => setForm({ ...form, bidsReceived: e.target.value ? Number(e.target.value) : null })}
              className="w-full rounded border border-border-default/50 px-2 py-1.5 text-[0.85rem]"
            />
          </Field>
          <Field label="Източник (URL)" full>
            <input
              value={form.sourceUrl ?? ""}
              onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
              className="w-full rounded border border-border-default/50 px-2 py-1.5 text-[0.85rem]"
            />
          </Field>
          <label className="flex items-center gap-2 text-[0.82rem]">
            <input
              type="checkbox"
              checked={form.euFunded}
              onChange={(e) => setForm({ ...form, euFunded: e.target.checked })}
            />
            Финансиран от ЕС
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

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={cn("flex flex-col gap-1 text-[0.78rem] text-[color:var(--color-text-secondary)]", full && "sm:col-span-2")}>
      {label}
      {children}
    </label>
  );
}
