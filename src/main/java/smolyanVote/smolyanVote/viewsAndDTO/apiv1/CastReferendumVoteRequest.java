package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/** POST /api/v1/votes/referendum body — {@code optionIndex} is 0-based (matches {@code VoteServiceImpl}). */
public record CastReferendumVoteRequest(
        @NotNull Long referendumId,
        @NotNull @Min(0) Integer optionIndex
) {
}
