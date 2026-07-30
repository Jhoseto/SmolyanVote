"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useToast } from "@/shared/hooks/useToast";
import { errorMessage } from "@/shared/lib/errorMessage";
import { adminMonitorApi } from "../../api/monitorAdmin";
import type { MonitorSchedulerSettings } from "../../types";

export function MonitorSchedulerTab({ enabled }: { enabled: boolean }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<MonitorSchedulerSettings | null>(null);

  const settingsQ = useQuery({
    queryKey: ["admin", "monitor", "scheduler-settings"],
    queryFn: () => adminMonitorApi.getSchedulerSettings(),
    enabled,
  });

  useEffect(() => {
    if (settingsQ.data && !form) {
      setForm(settingsQ.data);
    }
  }, [settingsQ.data, form]);

  const saveMut = useMutation({
    mutationFn: (body: MonitorSchedulerSettings) => adminMonitorApi.updateSchedulerSettings(body),
    onSuccess: (res) => {
      setForm(res);
      toast.success("Настройките са запазени и приложени веднага");
      void queryClient.invalidateQueries({ queryKey: ["admin", "monitor", "scheduler-settings"] });
    },
    onError: (e) => toast.error(errorMessage(e, "Запазването неуспешно")),
  });

  if (settingsQ.isLoading || !form) {
    return <Skeleton className="h-72 w-full rounded-[var(--radius-lg)]" />;
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[var(--radius-lg)] border border-amber-200 bg-amber-50/80 px-4 py-3 text-[0.82rem] text-amber-900">
        <i className="bi bi-info-circle mr-1.5" />
        Промените важат веднага за текущия сървър и се запазват в базата — оцеляват при рестарт, без нужда от redeploy.
      </div>

      <section className="rounded-[var(--radius-lg)] border border-border-default/35 bg-white/95 p-4">
        <h3 className="mb-3 font-display text-[0.95rem] font-semibold">Планирани задачи (cron)</h3>
        <div className="space-y-3">
          <Toggle
            label="Главен ключ на планировчика"
            description="Изключва всички задачи по-долу наведнъж"
            checked={form.schedulerEnabled}
            onChange={(v) => setForm({ ...form, schedulerEnabled: v })}
            strong
          />
          <Toggle
            label="SIGMA import"
            description="Ежедневно в 04:00 — договори от sigma.midt.bg"
            checked={form.sigmaEnabled}
            onChange={(v) => setForm({ ...form, sigmaEnabled: v })}
          />
          <Toggle
            label="EOP import"
            description="Ежедневно в 05:00 — storage.eop.bg fallback"
            checked={form.eopEnabled}
            onChange={(v) => setForm({ ...form, eopEnabled: v })}
          />
          <Toggle
            label="smolyan.bg scrape"
            description="Ежедневно в 06:00 — изисква Playwright sidecar"
            checked={form.scrapeEnabled}
            onChange={(v) => setForm({ ...form, scrapeEnabled: v })}
          />
          <Toggle
            label="AI batch"
            description="Ежедневно в 06:30 — Gemini резюмета за нови документи"
            checked={form.aiBatchEnabled}
            onChange={(v) => setForm({ ...form, aiBatchEnabled: v })}
          />
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-border-default/35 bg-white/95 p-4">
        <h3 className="mb-3 font-display text-[0.95rem] font-semibold">Лимити</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-[0.82rem]">
            EOP дни на планиран run (макс. {form.eopMaxDays})
            <input
              type="number"
              min={1}
              max={form.eopMaxDays}
              value={form.eopDays}
              onChange={(e) => setForm({ ...form, eopDays: Number(e.target.value) })}
              className="rounded border border-border-default/50 px-2 py-1.5"
            />
          </label>
          <label className="flex flex-col gap-1 text-[0.82rem]">
            AI batch limit (документи на run)
            <input
              type="number"
              min={1}
              max={200}
              value={form.aiBatchLimit}
              onChange={(e) => setForm({ ...form, aiBatchLimit: Number(e.target.value) })}
              className="rounded border border-border-default/50 px-2 py-1.5"
            />
          </label>
        </div>
      </section>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => settingsQ.data && setForm(settingsQ.data)}
          className="rounded-full border px-4 py-2 text-[0.85rem]"
        >
          Отказ
        </button>
        <button
          type="button"
          disabled={saveMut.isPending}
          onClick={() => saveMut.mutate(form)}
          className="rounded-full bg-primary px-5 py-2 text-[0.85rem] font-medium text-white disabled:opacity-50"
        >
          {saveMut.isPending ? "Запазване…" : "Запази настройките"}
        </button>
      </div>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
  strong,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  strong?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center justify-between gap-4 rounded-[var(--radius-md)] border px-3 py-2.5",
        strong ? "border-primary/30 bg-primary-50/40" : "border-border-default/35",
      )}
    >
      <span>
        <span className="block text-[0.85rem] font-semibold">{label}</span>
        <span className="block text-[0.72rem] text-[color:var(--color-text-muted)]">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 accent-[var(--color-primary)]"
      />
    </label>
  );
}
