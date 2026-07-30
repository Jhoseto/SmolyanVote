"use client";

import { Button } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { hapticTap } from "@/shared/lib/haptic";

interface SignalsMobileFabProps {
  visible: boolean;
  onClick: () => void;
  listTab?: boolean;
}

export function SignalsMobileFab({ visible, onClick, listTab }: SignalsMobileFabProps) {
  if (!visible) return null;

  return (
    <Button
      onClick={() => {
        hapticTap();
        onClick();
      }}
      className={cn("signals-mobile-fab h-12 gap-2 rounded-full px-4 shadow-[0_8px_24px_rgba(25,134,28,0.45)]", listTab && "signals-mobile-fab--list-tab")}
    >
      <i className="bi bi-megaphone-fill text-base" />
      Подай сигнал
    </Button>
  );
}
