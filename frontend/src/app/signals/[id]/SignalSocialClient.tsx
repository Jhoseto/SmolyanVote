"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

/** Deep-link handler — opens the interactive map modal UX. */
export function SignalSocialClient({ id }: { id: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("open") !== "map") return;
    router.replace(`/signals?openSignal=${id}`);
  }, [id, router, searchParams]);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16">
      <Link
        href={`/signals?openSignal=${id}`}
        className="btn-brand inline-flex items-center gap-2 rounded-[var(--radius-pill)] px-5 py-2.5 text-sm font-semibold shadow-[var(--shadow-md)]"
      >
        <i className="bi bi-map" />
        Отвори на картата
      </Link>
    </div>
  );
}
