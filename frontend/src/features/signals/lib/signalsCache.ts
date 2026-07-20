import type { QueryClient } from "@tanstack/react-query";
import { signalDetailQueryKey } from "../hooks/useSignalDetail";
import type { Signal } from "../types";

/** Patches every mounted `["signals","list",...]` query + the standalone detail query — mirrors `publications/lib/feedCache.ts#patchPublicationCaches`. */
export function patchSignalCaches(queryClient: QueryClient, id: number, patch: Partial<Signal>) {
  queryClient.setQueriesData<Signal[]>({ queryKey: ["signals", "list"] }, (data) =>
    data?.map((signal) => (signal.id === id ? { ...signal, ...patch } : signal)),
  );
  queryClient.setQueryData<Signal>(signalDetailQueryKey(id), (old) => (old ? { ...old, ...patch } : old));
}

/** DELETE — removes the signal from every mounted list query, drops the detail cache. */
export function removeSignalFromCaches(queryClient: QueryClient, id: number) {
  queryClient.setQueriesData<Signal[]>({ queryKey: ["signals", "list"] }, (data) => data?.filter((s) => s.id !== id));
  queryClient.removeQueries({ queryKey: signalDetailQueryKey(id) });
}
