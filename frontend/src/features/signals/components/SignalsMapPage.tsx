"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { useIsMobile } from "@/shared/hooks/useMediaQuery";
import { Skeleton } from "@/shared/ui";
import { useSignalsPageController } from "../hooks/useSignalsPageController";
import { SignalsMapPageDesktop } from "./SignalsMapPageDesktop";
import { SignalsMobileShell } from "./SignalsMobileShell";

interface SignalsMapPageProps {
  reportSlot?: (signalId: number) => ReactNode;
  commentsSlot?: (id: number) => ReactNode;
}

function useHasMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function SignalsMapPage({ reportSlot, commentsSlot }: SignalsMapPageProps) {
  const controller = useSignalsPageController();
  const isMobile = useIsMobile();
  const mounted = useHasMounted();

  if (!mounted) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[min(60dvh,620px)] w-full rounded-[var(--radius-lg)]" />
      </div>
    );
  }

  if (isMobile) {
    return <SignalsMobileShell controller={controller} reportSlot={reportSlot} commentsSlot={commentsSlot} />;
  }

  return <SignalsMapPageDesktop controller={controller} reportSlot={reportSlot} commentsSlot={commentsSlot} />;
}
