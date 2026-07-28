"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { messengerApi } from "../api";
import { ensureIdentity } from "../lib/e2eCrypto";

export const e2eKeyQueryKey = (userId: number) => ["messenger", "e2e-key", userId] as const;

/** Publishes this device's public key once per login so peers can encrypt to us. */
export function usePublishE2EKey(enabled: boolean, userId?: number | null) {
  const publishedFor = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || userId == null) {
      publishedFor.current = null;
      return;
    }
    if (publishedFor.current === userId) return;
    publishedFor.current = userId;
    void (async () => {
      try {
        const publicJwk = await ensureIdentity();
        await messengerApi.publishE2EKey(publicJwk);
      } catch {
        publishedFor.current = null;
      }
    })();
  }, [enabled, userId]);
}

export function usePeerE2EKey(userId: number | null | undefined) {
  return useQuery({
    queryKey: userId != null ? e2eKeyQueryKey(userId) : ["messenger", "e2e-key", "none"],
    queryFn: () => messengerApi.getE2EKey(userId as number),
    enabled: userId != null,
    staleTime: 10 * 60_000,
    retry: false,
  });
}
