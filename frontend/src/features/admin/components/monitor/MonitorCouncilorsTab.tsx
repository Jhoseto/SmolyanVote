"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useToast } from "@/shared/hooks/useToast";
import { errorMessage } from "@/shared/lib/errorMessage";
import { adminMonitorApi } from "../../api/monitorAdmin";
import type { MonitorAdminCouncilor, MonitorCouncilorRequest } from "../../types";

const EMPTY_FORM: MonitorCouncilorRequest = {
  fullName: "",
  roleLabel: "Съветник",
  party: null,
  mandatePeriod: "2023–2027",
  zpokonpiChecked: false,
  zpokonpiNote: null,
  sourceUrl: null,
};

export function MonitorCouncilorsTab({ enabled }: { enabled: boolean }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<MonitorAdminCouncilor | null>(null);
  const [creating, setCreating] = useState(false);

  const councilorsQ = useQuery({
    queryKey: ["admin", "monitor", "councilors"],
    queryFn: () => adminMonitorApi.listCouncilors(),
    enabled,
  });

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["admin", "monitor", "councilors"] });

  const createMut = useMutation({
    mutationFn: (body: MonitorCouncilorRequest) => adminMonitorApi.createCouncilor(body),
    onSuccess: () => {
      toast.success("Съветникът е добавен");
      invalidate();
      setCreating(false);
    },
    onError: (e) => toast.error(errorMessage(e, "Добавянето неуспешно")),
  });

  const updateMut = useMutation({
    mutationFn: (vars: { id: number; body: MonitorCouncilorRequest }) =>
      adminMonitorApi.updateCouncilor(vars.id, vars.body),
    onSuccess: () => {
      toast.success("Профилът е обновен");
      invalidate();
      setEditing(null);
    },
    onError: (e) => toast.error(errorMessage(e, "Обновяването неуспешно")),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => adminMonitorApi.deleteCouncilor(id),
    onSuccess: () => {
      toast.success("Профилът е изтрит");
      invalidate();
    },
    onError: (e) => toast.error(errorMessage(e, "Изтриването неуспешно")),
  });

  function confirmDelete(c: MonitorAdminCouncilor) {
    if (window.confirm(`Изтриване на "${c.fullName}"?`)) {
      deleteMut.mutate(c.id);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-[0.95rem] font-semibold">Общински съветници</h3>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="rounded-full bg-primary px-4 py-2 text-[0.8rem] font-medium text-white"
        >
          <i className="bi bi-plus-lg mr-1" />
          Нов профил
        </button>
      </div>

      {councilorsQ.isLoading ? (
        <Skeleton className="h-64 w-full rounded-[var(--radius-lg)]" />
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border-default/35">
          <table className="w-full min-w-[820px] text-left text-[0.82rem]">
            <thead className="bg-[color:var(--color-surface-muted)] text-[0.72rem] uppercase tracking-wide text-[color:var(--color-text-muted)]">
              <tr>
                <th className="px-3 py-2">Име</th>
                <th className="px-3 py-2">Роля</th>
                <th className="px-3 py-2">Партия</th>
                <th className="px-3 py-2">Мандат</th>
                <th className="px-3 py-2">ЗПКОНПИ</th>
                <th className="px-3 py-2 text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {(councilorsQ.data ?? []).map((c) => (
                <tr key={c.id} className="border-t border-border-default/25">
                  <td className="px-3 py-2 font-medium">{c.fullName}</td>
                  <td className="px-3 py-2 text-[color:var(--color-text-secondary)]">{c.roleLabel ?? "—"}</td>
                  <td className="px-3 py-2 text-[color:var(--color-text-secondary)]">{c.party ?? "—"}</td>
                  <td className="px-3 py-2 text-[color:var(--color-text-muted)]">{c.mandatePeriod ?? "—"}</td>
                  <td className="px-3 py-2">
                    {c.zpokonpiChecked ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[0.68rem] font-medium text-emerald-800">
                        Проверен
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.68rem] font-medium text-amber-800">
                        Предстои
                      </span>
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
              {(councilorsQ.data ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-[color:var(--color-text-muted)]">
                    Няма профили — пуснете sync или добавете ръчно
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {(editing || creating) && (
        <CouncilorEditModal
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

function CouncilorEditModal({
  initial,
  onClose,
  onSave,
  saving,
}: {
  initial: MonitorAdminCouncilor | null;
  onClose: () => void;
  onSave: (body: MonitorCouncilorRequest) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<MonitorCouncilorRequest>(
    initial
      ? {
          fullName: initial.fullName,
          roleLabel: initial.roleLabel,
          party: initial.party,
          mandatePeriod: initial.mandatePeriod,
          zpokonpiChecked: initial.zpokonpiChecked,
          zpokonpiNote: initial.zpokonpiNote,
          sourceUrl: initial.sourceUrl,
        }
      : EMPTY_FORM,
  );

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-[var(--radius-lg)] bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="font-display text-[0.95rem] font-semibold">
            {initial ? `Редакция на ${initial.fullName}` : "Нов профил на съветник"}
          </h4>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-black/[0.05]">
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className="grid gap-3 overflow-y-auto px-4 py-4">
          <Field label="Име">
            <input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full rounded border border-border-default/50 px-2 py-1.5 text-[0.85rem]"
            />
          </Field>
          <Field label="Роля">
            <input
              value={form.roleLabel ?? ""}
              onChange={(e) => setForm({ ...form, roleLabel: e.target.value })}
              className="w-full rounded border border-border-default/50 px-2 py-1.5 text-[0.85rem]"
            />
          </Field>
          <Field label="Партия / коалиция">
            <input
              value={form.party ?? ""}
              onChange={(e) => setForm({ ...form, party: e.target.value })}
              className="w-full rounded border border-border-default/50 px-2 py-1.5 text-[0.85rem]"
            />
          </Field>
          <Field label="Мандат">
            <input
              value={form.mandatePeriod ?? ""}
              onChange={(e) => setForm({ ...form, mandatePeriod: e.target.value })}
              className="w-full rounded border border-border-default/50 px-2 py-1.5 text-[0.85rem]"
            />
          </Field>
          <Field label="Бележка по ЗПКОНПИ">
            <textarea
              value={form.zpokonpiNote ?? ""}
              onChange={(e) => setForm({ ...form, zpokonpiNote: e.target.value })}
              rows={2}
              className="w-full rounded border border-border-default/50 px-2 py-1.5 text-[0.85rem]"
            />
          </Field>
          <Field label="Източник (URL)">
            <input
              value={form.sourceUrl ?? ""}
              onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
              className="w-full rounded border border-border-default/50 px-2 py-1.5 text-[0.85rem]"
            />
          </Field>
          <label className="flex items-center gap-2 text-[0.82rem]">
            <input
              type="checkbox"
              checked={form.zpokonpiChecked}
              onChange={(e) => setForm({ ...form, zpokonpiChecked: e.target.checked })}
            />
            ЗПКОНПИ декларация проверена
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t px-4 py-3">
          <button type="button" onClick={onClose} className="rounded-full border px-4 py-2 text-[0.85rem]">
            Отказ
          </button>
          <button
            type="button"
            disabled={saving || !form.fullName.trim()}
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
