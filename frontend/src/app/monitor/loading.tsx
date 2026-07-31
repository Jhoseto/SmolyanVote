import { LogoLoader } from "@/shared/ui";

/** Shown while Next.js loads a monitor tab route. */
export default function MonitorRouteLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center pb-16 pt-[calc(var(--navbar-height)+1.5rem)]">
      <LogoLoader label="Зареждане…" size="md" />
    </div>
  );
}
