"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useToast } from "@/shared/hooks/useToast";
import { errorMessage } from "@/shared/lib/errorMessage";
import { signalsApi } from "../api";
import { patchSignalCaches } from "../lib/signalsCache";
import { signalFieldClass } from "./SignalModalShell";
import { DeleteSignalButton } from "./DeleteSignalButton";
import type { Signal } from "../types";

interface SignalAdminSectionProps {
  signal: Signal;
  onDeleted?: () => void;
}

export function SignalAdminSection({ signal, onDeleted }: SignalAdminSectionProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [adminNotes, setAdminNotes] = useState(signal.adminNotes ?? "");
  const [markResolved, setMarkResolved] = useState(signal.isResolved);
  const [markActive, setMarkActive] = useState(signal.isActive);

  useEffect(() => {
    setAdminNotes(signal.adminNotes ?? "");
    setMarkResolved(signal.isResolved);
    setMarkActive(signal.isActive);
  }, [signal.id, signal.adminNotes, signal.isResolved, signal.isActive]);

  const { mutate, isPending } = useMutation({
    mutationFn: () => signalsApi.moderate(signal.id, { adminNotes, markResolved, markActive }),
    onSuccess: (updated) => {
      patchSignalCaches(queryClient, signal.id, updated);
      toast.success("Модерацията е запазена.");
    },
    onError: (error) => toast.error(errorMessage(error, "Модерацията не бе запазена.")),
  });

  return (
    <div className="overflow-hidden rounded-[var(--radius-xl)] border border-amber-200/80 bg-gradient-to-br from-amber-50/90 via-white to-white shadow-[0_4px_20px_rgba(245,158,11,0.08)]">
      <div className="border-b border-amber-200/60 bg-amber-50/80 px-4 py-3">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-amber-950">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <i className="bi bi-shield-check" />
          </span>
          Админ модерация
        </h4>
      </div>

      <div className="space-y-3 p-4">
        {signal.resolvedByUsername && (
          <p className="rounded-[var(--radius-md)] bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Маркиран като решен от: <strong>{signal.resolvedByUsername}</strong>
          </p>
        )}

        <textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          rows={3}
          placeholder="Административни бележки…"
          className={cn(signalFieldClass, "border-amber-200/60 focus:border-amber-400 focus:ring-amber-200/40")}
        />

        <label className="flex items-center gap-2.5 rounded-[var(--radius-md)] border border-amber-200/50 bg-amber-50/50 px-3 py-2.5 text-sm font-medium text-amber-950">
          <input
            type="checkbox"
            checked={markActive}
            onChange={(e) => setMarkActive(e.target.checked)}
            className="accent-amber-600"
          />
          Активен на платформата
        </label>

        <label className="flex items-center gap-2.5 rounded-[var(--radius-md)] border border-amber-200/50 bg-amber-50/50 px-3 py-2.5 text-sm font-medium text-amber-950">
          <input
            type="checkbox"
            checked={markResolved}
            onChange={(e) => setMarkResolved(e.target.checked)}
            className="accent-amber-600"
          />
          Маркирай като решен
        </label>

        <Button type="button" size="sm" onClick={() => mutate()} disabled={isPending} className="shadow-sm">
          {isPending ? "Запазване…" : "Запази модерация"}
        </Button>

        <div className="border-t border-amber-200/50 pt-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-amber-900/70">Опасна зона</p>
          <DeleteSignalButton
            id={signal.id}
            onDeleted={onDeleted}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  );
}
