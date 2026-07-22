"use client";

import { useQuery } from "@tanstack/react-query";
import { signalsApi, SIGNALS_DATASET_QUERY_KEY } from "../api";

/** Single fetch of all region signals — client-side filter/sort/priority. */
export function useSignalsDataset() {
  return useQuery({
    queryKey: SIGNALS_DATASET_QUERY_KEY,
    queryFn: () => signalsApi.dataset(),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
  });
}
