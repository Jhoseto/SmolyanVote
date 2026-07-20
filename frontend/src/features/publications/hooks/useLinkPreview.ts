"use client";

import { useMutation } from "@tanstack/react-query";
import { publicationsApi } from "../api";
import { parseLinkMetadata } from "../lib/linkMetadata";

/**
 * Fetched on-demand (debounced blur/Enter in the composer), not a `useQuery`
 * — a link preview is a one-shot side-effect tied to typing, not cached data
 * that other components need to read.
 */
export function useLinkPreview() {
  return useMutation({
    mutationFn: async (url: string) => {
      const res = await publicationsApi.linkPreview(url);
      const metadata = parseLinkMetadata(res.metadata);
      if (!metadata) throw new Error("Не успяхме да заредим визуализация за този линк.");
      return metadata;
    },
  });
}
