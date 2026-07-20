import { useConfirmStore, type ConfirmOptions } from "@/shared/lib/confirmStore";

/**
 * `const confirm = useConfirm(); const ok = await confirm({ title, ... });`
 * Replaces V1's `window.confirm()` / bespoke per-feature confirm modals
 * (MODERN_FRONTEND_PLAN §Модерни UX системи).
 */
export function useConfirm(): (options: ConfirmOptions) => Promise<boolean> {
  return useConfirmStore((s) => s.request);
}
