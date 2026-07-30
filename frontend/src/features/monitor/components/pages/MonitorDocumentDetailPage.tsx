"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { EmptyState, LogoLoader } from "@/shared/ui";
import { monitorApi } from "../../api";
import { formatDate, formatEur } from "../../lib/format";
import { MonitorShareButton } from "../MonitorShareButton";
import type { MonitorDocumentDetail } from "../../types";

export function MonitorDocumentDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const invalidId = !Number.isFinite(id);
  const [doc, setDoc] = useState<MonitorDocumentDetail | null>(null);
  const [loading, setLoading] = useState(!invalidId);
  const [error, setError] = useState(invalidId);

  useEffect(() => {
    if (invalidId) return;
    let cancelled = false;
    monitorApi
      .document(id)
      .then((data) => {
        if (!cancelled) setDoc(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, invalidId]);

  if (loading) return <LogoLoader fullScreen label="Зареждане…" />;
  if (error || !doc) {
    return (
      <div className="pt-24">
        <EmptyState icon="bi-file-x" title="Документът не е намерен" />
      </div>
    );
  }

  return (
    <div className="pb-16 pt-[calc(var(--navbar-height)+1.5rem)]">
      <div className="mx-auto max-w-3xl px-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/monitor" className="text-[0.85rem] text-primary hover:underline">
            ← Монитор
          </Link>
          <MonitorShareButton title={doc.title} />
        </div>
        <header className="mt-4 space-y-3">
          <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[0.68rem] font-medium text-primary">
            {doc.documentType}
          </span>
          <h1 className="font-display text-[1.35rem] font-bold leading-snug">{doc.title}</h1>
          {doc.shortSummary && (
            <p className="text-[0.95rem] text-[color:var(--color-text-secondary)]">{doc.shortSummary}</p>
          )}
        </header>

        <dl className="mt-8 grid gap-3 sm:grid-cols-2">
          <Fact label="Публикуван" value={formatDate(doc.publishedAt)} />
          <Fact label="Краен срок" value={formatDate(doc.deadlineDate)} />
          <Fact label="Сума" value={doc.amount != null ? formatEur(doc.amount) : null} />
          <Fact label="Фирма" value={doc.companyName} />
        </dl>

        {doc.sourceUrl && (
          <a
            href={doc.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[0.9rem] font-medium text-white"
          >
            Виж оригинала ↗
          </a>
        )}
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border-default/30 bg-white/90 px-3 py-2.5">
      <dt className="text-[0.68rem] font-medium uppercase tracking-wide text-[color:var(--color-text-muted)]">
        {label}
      </dt>
      <dd className="mt-0.5 text-[0.9rem] font-medium text-[color:var(--color-text-heading)]">
        {value ?? "—"}
      </dd>
    </div>
  );
}
