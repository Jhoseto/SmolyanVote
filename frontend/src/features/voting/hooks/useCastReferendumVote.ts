"use client";

import { useMutation } from "@tanstack/react-query";
import { votesApi } from "../api";
import type { CastReferendumVotePayload } from "../types";

export function useCastReferendumVote() {
  return useMutation({
    mutationFn: (payload: CastReferendumVotePayload) =>
      votesApi.castReferendumVote(payload, crypto.randomUUID()),
  });
}
