"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { podcastApi } from "../api";
import { useRequireAuth } from "@/shared/hooks/useRequireAuth";
import { useAuth } from "@/shared/lib/authContext";
import { toast } from "@/shared/hooks/useToast";
import type { PodcastSubscriptionType } from "../types";

const QUERY_KEY = ["podcast", "subscription"];

/** Subscribe/unsubscribe toggle for `PODCAST_EPISODES` — reuses the shared `/api/v1/subscriptions` resource. */
export function usePodcastSubscription() {
  const { isAuthenticated } = useAuth();
  const requireAuth = useRequireAuth();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => podcastApi.subscription(),
    enabled: isAuthenticated,
  });

  const isSubscribed = data?.types.includes("PODCAST_EPISODES") ?? false;

  const mutation = useMutation({
    mutationFn: (nextTypes: PodcastSubscriptionType[]) => podcastApi.updateSubscription(nextTypes),
    onSuccess: (response) => queryClient.setQueryData(QUERY_KEY, response),
    onError: () => toast.error("Възникна грешка. Моля, опитайте отново."),
  });

  async function toggle() {
    const allowed = await requireAuth("да се абонираш за нови епизоди");
    if (!allowed) return;

    const current = data?.types ?? [];
    const next: PodcastSubscriptionType[] = isSubscribed
      ? current.filter((t) => t !== "PODCAST_EPISODES")
      : [...current, "PODCAST_EPISODES"];
    mutation.mutate(next);
  }

  return { isSubscribed, toggle, isPending: mutation.isPending };
}
