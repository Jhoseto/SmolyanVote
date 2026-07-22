"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Human affordance + notification deep-link handler.
 * Keeps SSR article HTML intact for crawlers / AI engines.
 * `?open=social` (from notification actionUrl) jumps into the feed modal UX.
 */
export function PublicationSocialClient({ id }: { id: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("open") !== "social") return;
    const q = new URLSearchParams({ openModal: String(id) });
    if (searchParams.get("focus") === "comments") q.set("focus", "comments");
    router.replace(`/publications?${q.toString()}`);
  }, [id, router, searchParams]);

  const socialHref =
    searchParams.get("focus") === "comments"
      ? `/publications?openModal=${id}&focus=comments`
      : `/publications?openModal=${id}`;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16">
      <Link
        href={socialHref}
        className="btn-brand inline-flex items-center gap-2 rounded-[var(--radius-pill)] px-5 py-2.5 text-sm font-semibold shadow-[var(--shadow-md)]"
      >
        <i className="bi bi-chat-square-text" />
        Отвори в социалния изглед
      </Link>
    </div>
  );
}
