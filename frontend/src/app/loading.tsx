import { LogoLoader } from "@/shared/ui";

/** Route-level fallback — brand logo spinner for every App Router navigation. */
export default function Loading() {
  return <LogoLoader fullScreen size="lg" />;
}
