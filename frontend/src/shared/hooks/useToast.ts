import { toast } from "sonner";

/**
 * Unified toast API (MODERN_FRONTEND_PLAN §Модерни UX системи).
 * Thin re-export over Sonner — single call-site for the whole app so the
 * underlying library can be swapped without touching feature code.
 */
export function useToast() {
  return toast;
}

export { toast };
