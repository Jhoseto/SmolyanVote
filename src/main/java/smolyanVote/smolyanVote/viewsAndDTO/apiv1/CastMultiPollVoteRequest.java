package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/** POST /api/v1/votes/multipoll body — {@code selectedOptions} are 1-based (matches {@code VoteServiceImpl}). */
public record CastMultiPollVoteRequest(
        @NotNull Long pollId,
        @NotEmpty @Size(max = 3) List<Integer> selectedOptions
) {
}
