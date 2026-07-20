import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import { publicationDetailQueryKey } from "../hooks/usePublicationDetail";
import type { Publication, PublicationsPageResponse } from "../types";

type FeedData = InfiniteData<PublicationsPageResponse>;

/**
 * Patches a single publication (by id) across every mounted feed query,
 * instead of invalidating/refetching — avoids a scroll-jump for like/
 * dislike/bookmark/share toggles (write = server ack, same "no reload"
 * principle as `useCastSimpleEventVote`).
 */
export function patchPublicationInFeedCache(
  queryClient: QueryClient,
  id: number,
  patch: Partial<Publication>,
) {
  queryClient.setQueriesData<FeedData>({ queryKey: ["publications", "feed"] }, (data) => {
    if (!data) return data;
    return {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        content: page.content.map((pub) => (pub.id === id ? { ...pub, ...patch } : pub)),
      })),
    };
  });
}

/** DELETE — removes the publication from every mounted feed query without a full refetch. */
export function removePublicationFromFeedCache(queryClient: QueryClient, id: number) {
  queryClient.setQueriesData<FeedData>({ queryKey: ["publications", "feed"] }, (data) => {
    if (!data) return data;
    return {
      ...data,
      pages: data.pages.map((page) => {
        if (!page.content.some((pub) => pub.id === id)) return page;
        return {
          ...page,
          content: page.content.filter((pub) => pub.id !== id),
          totalElements: Math.max(0, page.totalElements - 1),
        };
      }),
    };
  });
  queryClient.removeQueries({ queryKey: publicationDetailQueryKey(id) });
}

/** Like `patchPublicationInFeedCache`, but also patches the standalone detail-modal query. */
export function patchPublicationCaches(queryClient: QueryClient, id: number, patch: Partial<Publication>) {
  patchPublicationInFeedCache(queryClient, id, patch);
  queryClient.setQueryData<Publication>(publicationDetailQueryKey(id), (old) => (old ? { ...old, ...patch } : old));
}
