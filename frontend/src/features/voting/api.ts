import { apiClient } from "@/lib/api/client";
import type {
  CastMultiPollVotePayload,
  CastReferendumVotePayload,
  CastSimpleEventVotePayload,
  VoteAckResponse,
} from "./types";

/**
 * Thin wrappers over `VotesController` — write-only. Callers refetch
 * the relevant `/api/v1/events/**` detail query afterwards for
 * authoritative counts (read path = single source of truth).
 */
export const votesApi = {
  castSimpleEventVote: (payload: CastSimpleEventVotePayload, idempotencyKey: string) =>
    apiClient.post<VoteAckResponse>("/api/v1/votes/simple", { body: payload, idempotencyKey }),

  castReferendumVote: (payload: CastReferendumVotePayload, idempotencyKey: string) =>
    apiClient.post<VoteAckResponse>("/api/v1/votes/referendum", { body: payload, idempotencyKey }),

  castMultiPollVote: (payload: CastMultiPollVotePayload, idempotencyKey: string) =>
    apiClient.post<VoteAckResponse>("/api/v1/votes/multipoll", { body: payload, idempotencyKey }),
};
