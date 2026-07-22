import type { QueryClient } from "@tanstack/react-query";
import { signalDetailQueryKey } from "../hooks/useSignalDetail";
import { SIGNALS_DATASET_QUERY_KEY } from "../api";
import type { Signal } from "../types";

/** Patches dataset cache + optional detail query. */
export function patchSignalCaches(queryClient: QueryClient, id: number, patch: Partial<Signal>) {
  queryClient.setQueryData<Signal[]>(SIGNALS_DATASET_QUERY_KEY, (data) =>
    data?.map((signal) => (signal.id === id ? { ...signal, ...patch } : signal)),
  );
  queryClient.setQueryData<Signal>(signalDetailQueryKey(id), (old) => (old ? { ...old, ...patch } : old));
}

/** Prepends a newly created signal to the dataset cache. */
export function prependSignalToDataset(queryClient: QueryClient, signal: Signal) {
  queryClient.setQueryData<Signal[]>(SIGNALS_DATASET_QUERY_KEY, (data) => [signal, ...(data ?? [])]);
}

/** Removes the signal from dataset cache, drops detail cache. */
export function removeSignalFromCaches(queryClient: QueryClient, id: number) {
  queryClient.setQueryData<Signal[]>(SIGNALS_DATASET_QUERY_KEY, (data) => data?.filter((s) => s.id !== id));
  queryClient.removeQueries({ queryKey: signalDetailQueryKey(id) });
}
