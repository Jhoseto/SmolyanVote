import { useAuth } from "@/shared/lib/authContext";
import { useLoginGateStore } from "@/shared/lib/loginGateStore";

/**
 * `const requireAuth = useRequireAuth(); if (await requireAuth("да гласуваш")) { ... }`
 *
 * Resolves immediately for logged-in users. For anonymous users it opens
 * `<LoginGateModal/>` (inline login form) and resolves `true` once the form
 * reports a successful session, or `false` if the user dismisses it.
 * Replaces V1's hard `window.location.href = "/login"`.
 */
export function useRequireAuth(): (reason?: string) => Promise<boolean> {
  const { isAuthenticated } = useAuth();
  const request = useLoginGateStore((s) => s.request);

  return async (reason?: string) => {
    if (isAuthenticated) return true;
    return request(reason);
  };
}
