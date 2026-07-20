"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLoginGateStore, type AuthModalView } from "@/shared/lib/loginGateStore";

/** Legacy /login|/register|/forgotten_password → home + open auth modal. */
export function AuthRouteRedirect({ view }: { view: AuthModalView }) {
  const router = useRouter();

  useEffect(() => {
    useLoginGateStore.getState().open(view);
    router.replace("/");
  }, [router, view]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-[color:var(--color-text-muted)]">
      Пренасочване…
    </div>
  );
}
