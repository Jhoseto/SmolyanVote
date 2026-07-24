import { useAuth } from "@/shared/lib/authContext";
import { useLoginGateStore } from "@/shared/lib/loginGateStore";
import { showReadOnlyWarning } from "@/shared/lib/moderationStore";

/**
 * `const requireAuth = useRequireAuth(); if (await requireAuth("да гласуваш")) { ... }`
 *
 * Resolves immediately for logged-in users who may interact. For anonymous users
 * it opens `<LoginGateModal/>`. For read-only banned users it shows the
 * moderation warning modal and returns `false`.
 */
export function useRequireAuth(): (reason?: string) => Promise<boolean> {
  const { isAuthenticated, user } = useAuth();
  const request = useLoginGateStore((s) => s.request);

  return async (reason?: string) => {
    if (!isAuthenticated) return request(reason);
    if (user?.readOnly) {
      showReadOnlyWarning(user);
      return false;
    }
    return true;
  };
}
