"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useToast } from "@/shared/hooks/useToast";
import { errorMessage } from "@/shared/lib/errorMessage";
import { adminMonitorApi } from "../../api/monitorAdmin";
import type { MonitorAdminDocument, MonitorAdminRawDocument } from "../../types";

type DocFilter = "recent" | "pending";

export function MonitorDocumentsTab({ enabled }: { enabled: boolean }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [docFilter, setDocFilter] = useState<DocFilter>("pending");
  const [rawPreview, setRawPreview] = useState<MonitorAdminRawDocument | null>(null);
  const [rawLoading, setRawLoading] = useState(false);

  const docsQ = useQuery({
    queryKey: ["admin", "monitor", "documents", docFilter],
    queryFn: () => adminMonitorApi.documents(docFilter, 50),
    enabled,
  });

  const invalidateAll = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "monitor"] });
  }, [queryClient]);

  const reprocessMut = useMutation({
    mutationFn: (id: number) => adminMonitorApi.reprocessDocument(id),
    onSuccess: () => {
      toast.success("Документът е преработен с AI");
      invalidateAll();
    },
    onError: (e) => toast.error(errorMessage(e, "AI reprocess неуспешен")),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => adminMonitorApi.deleteDocument(id),
    onSuccess: () => {
      toast.success("Документът е изтрит");
      invalidateAll();
    },
    onError: (e) => toast.error(errorMessage(e, "Изтриването неуспешно")),
  });

  const busy = reprocessMut.isPending || deleteMut.isPending;

  async function openRawPreview(doc: MonitorAdminDocument) {
    setRawLoading(true);
    try {
      const raw = await adminMonitorApi.rawDocument(doc.id);
      setRawPreview(raw);
    } catch (e) {
      toast.error(errorMessage(e, "Неуспешно зареждане на raw съдържание"));
    } finally {
      setRawLoading(false);
    }
  }

  function confirmDelete(doc: MonitorAdminDocument) {
    if (window.confirm(`Изтриване на "${doc.title}"? Действието е безвъзвратно.`)) {
      deleteMut.mutate(doc.id);
    }
  }

  return (
    <div className="space-y-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-[0.95rem] font-semibold">Документи</h3>
        <div className="flex rounded-full border border-border-default/50 p-0.5">
          <FilterTab active={docFilter === "pending"} onClick={() => setDocFilter("pending")}>
            Чакат AI
          </FilterTab>
          <FilterTab active={docFilter === "recent"} onClick={() => setDocFilter("recent")}>
            Последни
          </FilterTab>
        </div>
      </div>
      {docsQ.isLoading ? (
        <Skeleton className="h-48 w-full rounded-[var(--radius-lg)]" />
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border-default/35">
          <table className="w-full min-w-[720px] text-left text-[0.82rem]">
            <thead className="bg-[color:var(--color-surface-muted)] text-[0.72rem] uppercase tracking-wide text-[color:var(--color-text-muted)]">
              <tr>
                <th className="px-3 py-2">Заглавие</th>
                <th className="px-3 py-2">Тип</th>
                <th className="px-3 py-2">Резюме</th>
                <th className="px-3 py-2">AI</th>
                <th className="px-3 py-2 text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {(docsQ.data ?? []).map((doc) => (
                <tr key={doc.id} className="border-t border-border-default/25">
                  <td className="max-w-[220px] px-3 py-2">
                    <p className="line-clamp-2 font-medium">{doc.title}</p>
                    {doc.sourceUrl && (
                      <a
                        href={doc.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[0.72rem] text-primary hover:underline"
                      >
                        Оригинал ↗
                      </a>
                    )}
                  </td>
                  <td className="px-3 py-2 text-[color:var(--color-text-muted)]">{doc.documentType}</td>
                  <td className="max-w-[200px] px-3 py-2">
                    <p className="line-clamp-2 text-[color:var(--color-text-secondary)]">
                      {doc.shortSummary ?? "—"}
                    </p>
                  </td>
                  <td className="px-3 py-2">
                    {doc.aiPending ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.68rem] font-medium text-amber-800">
                        Pending
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[0.68rem] font-medium text-emerald-800">
                        OK
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1.5">
                      {doc.hasRawContent && (
                        <IconButton
                          icon="bi-file-text"
                          title="Raw preview"
                          disabled={rawLoading || busy}
                          onClick={() => openRawPreview(doc)}
                        />
                      )}
                      <IconButton
                        icon="bi-stars"
                        title="Reprocess AI"
                        disabled={busy || !doc.hasRawContent}
                        onClick={() => reprocessMut.mutate(doc.id)}
                      />
                      <IconButton
                        icon="bi-trash"
                        title="Изтрий"
                        danger
                        disabled={busy}
                        onClick={() => confirmDelete(doc)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {(docsQ.data ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-[color:var(--color-text-muted)]">
                    {docFilter === "pending" ? "Няма документи в AI опашката" : "Няма документи — пуснете scrape"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {rawPreview && (
        <RawPreviewModal
          doc={rawPreview}
          onClose={() => setRawPreview(null)}
          onReprocess={() => {
            reprocessMut.mutate(rawPreview.id);
            setRawPreview(null);
          }}
          reprocessing={reprocessMut.isPending}
        />
      )}
    </div>
  );
}

function FilterTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 text-[0.78rem] font-medium transition",
        active ? "bg-primary text-white" : "text-[color:var(--color-text-secondary)] hover:bg-black/[0.04]",
      )}
    >
      {children}
    </button>
  );
}

function IconButton({
  icon,
  title,
  onClick,
  disabled,
  danger,
}: {
  icon: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] border text-[color:var(--color-text-secondary)] disabled:opacity-40",
        danger
          ? "border-red-200 hover:bg-red-50 hover:text-red-700"
          : "border-border-default/40 hover:bg-primary-50 hover:text-primary",
      )}
    >
      <i className={cn("bi", icon)} />
    </button>
  );
}

function RawPreviewModal({
  doc,
  onClose,
  onReprocess,
  reprocessing,
}: {
  doc: MonitorAdminRawDocument;
  onClose: () => void;
  onReprocess: () => void;
  reprocessing: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-[var(--radius-lg)] bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h4 className="font-display text-[0.95rem] font-semibold">Raw preview</h4>
            <p className="line-clamp-1 text-[0.78rem] text-[color:var(--color-text-muted)]">{doc.title}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-black/[0.05]">
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-3">
          <p className="mb-2 text-[0.72rem] text-[color:var(--color-text-muted)]">
            Hash: {doc.contentHash ?? "—"}
          </p>
          <pre className="whitespace-pre-wrap rounded bg-[color:var(--color-surface-muted)] p-3 text-[0.78rem] leading-relaxed">
            {doc.rawContent ?? "(празно)"}
          </pre>
        </div>
        <div className="flex justify-end gap-2 border-t px-4 py-3">
          {doc.sourceUrl && (
            <a
              href={doc.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border px-4 py-2 text-[0.85rem]"
            >
              Оригинал ↗
            </a>
          )}
          <button
            type="button"
            disabled={reprocessing}
            onClick={onReprocess}
            className="rounded-full bg-primary px-4 py-2 text-[0.85rem] font-medium text-white disabled:opacity-50"
          >
            {reprocessing ? "AI…" : "Reprocess AI"}
          </button>
        </div>
      </div>
    </div>
  );
}
