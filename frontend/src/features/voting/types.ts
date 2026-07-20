export interface CastSimpleEventVotePayload {
  eventId: number;
  vote: "1" | "2" | "3";
}

/** `optionIndex` is 0-based (matches backend `VoteServiceImpl`). */
export interface CastReferendumVotePayload {
  referendumId: number;
  optionIndex: number;
}

/** `selectedOptions` are 1-based, max 3 (matches backend `VoteServiceImpl`). */
export interface CastMultiPollVotePayload {
  pollId: number;
  selectedOptions: number[];
}

export interface VoteAckResponse {
  success: boolean;
  message: string;
}
