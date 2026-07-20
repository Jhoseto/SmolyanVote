"use client";

import { useMutation } from "@tanstack/react-query";
import { votesApi } from "../api";
import type { CastSimpleEventVotePayload } from "../types";

/** Write-only mutation — caller refetches the detail query on success for authoritative counts. */
export function useCastSimpleEventVote() {
  return useMutation({
    mutationFn: (payload: CastSimpleEventVotePayload) =>
      votesApi.castSimpleEventVote(payload, crypto.randomUUID()),
  });
}
