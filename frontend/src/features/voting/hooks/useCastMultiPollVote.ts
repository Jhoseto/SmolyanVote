"use client";

import { useMutation } from "@tanstack/react-query";
import { votesApi } from "../api";
import type { CastMultiPollVotePayload } from "../types";

export function useCastMultiPollVote() {
  return useMutation({
    mutationFn: (payload: CastMultiPollVotePayload) =>
      votesApi.castMultiPollVote(payload, crypto.randomUUID()),
  });
}
