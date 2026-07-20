import { createContext, useContext } from "react";
import type { CurrentUser } from "@/types/auth";

export interface AuthState {
  isAuthenticated: boolean;
  /**
   * False until the client has read tokens from storage after mount.
   * Use this to avoid SSR/client auth UI mismatches (hydration).
   */
  isHydrated: boolean;
  /** True while `GET /api/v1/users/me` is resolving for an authenticated session. */
  isLoadingUser: boolean;
  user: CurrentUser | null;
  /** `persist=false` (remember-me unchecked) keeps tokens session-only (sessionStorage). */
  setSession: (access: string, refresh?: string, persist?: boolean) => void;
  clearSession: () => void;
  /** Best-effort server logout + local session clear. */
  logout: () => void;
}

/**
 * Context lives in `shared/` (not `providers/`) so that `shared/hooks/*`
 * (e.g. `useRequireAuth`) can depend on it without violating the
 * `shared` → `providers` boundary (architecture DAG forbids the reverse).
 * `providers/AuthProvider` owns the actual state and supplies the value.
 */
export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
