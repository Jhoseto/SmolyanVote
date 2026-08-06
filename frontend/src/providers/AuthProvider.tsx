"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { tokenStore } from "@/lib/api/tokenStore";
import { authApi } from "@/features/auth/api";
import { AuthContext, type AuthState, useAuth } from "@/shared/lib/authContext";

const ME_QUERY_KEY = ["auth", "me"] as const;

/**
 * Holds session presence (JWT tokens) + the real user profile
 * (`GET /api/v1/users/me`), hydrated once a token is present. Login/
 * register forms live in `features/auth/` — this provider only owns state
 * (setSession/clearSession/logout), matching the plan's Phase 2 scope.
 *
 * Token presence is always read after mount so SSR HTML matches the first
 * client paint (avoids hydration mismatch with localStorage session).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [hasToken, setHasToken] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const access = tokenStore.getAccess();
    setHasToken(access !== null);
    if (access) tokenStore.syncAccessCookie();
    setIsHydrated(true);
  }, []);

  const meQuery = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: () => authApi.me(),
    enabled: hasToken,
    retry: false,
    staleTime: 5 * 60_000,
  });

  // If the token turns out to be invalid/expired (and silent refresh already
  // failed inside apiClient), `meQuery.isError` derives `isAuthenticated`
  // back to false immediately — no separate setState needed. Dropping the
  // dead tokens from storage is a genuine external-system side effect.
  useEffect(() => {
    if (hasToken && meQuery.data) {
      tokenStore.syncAccessCookie();
    }
  }, [hasToken, meQuery.data]);

  const isAuthenticated = hasToken && !meQuery.isError;

  useEffect(() => {
    if (hasToken && meQuery.isError) {
      tokenStore.clear();
    }
  }, [hasToken, meQuery.isError]);

  const value = useMemo<AuthState>(
    () => ({
      isAuthenticated,
      isHydrated,
      isLoadingUser: isAuthenticated && meQuery.isPending,
      user: isAuthenticated ? (meQuery.data ?? null) : null,
      setSession: (access, refresh, persist = true) => {
        tokenStore.set(access, refresh, persist);
        setHasToken(true);
      },
      clearSession: () => {
        tokenStore.clear();
        setHasToken(false);
        queryClient.removeQueries({ queryKey: ME_QUERY_KEY });
      },
      logout: () => {
        authApi.logout().catch(() => {
          /* stateless endpoint — client-side clear is what actually matters */
        });
        tokenStore.clear();
        setHasToken(false);
        queryClient.removeQueries({ queryKey: ME_QUERY_KEY });
      },
    }),
    [isAuthenticated, isHydrated, meQuery.isPending, meQuery.data, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { useAuth };
