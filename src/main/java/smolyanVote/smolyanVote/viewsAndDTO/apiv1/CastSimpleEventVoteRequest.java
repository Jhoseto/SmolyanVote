package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/** POST /api/v1/votes/simple body — {@code vote}: "1" (за) / "2" (против) / "3" (въздържал се). */
public record CastSimpleEventVoteRequest(
        @NotNull Long eventId,
        @NotBlank @Pattern(regexp = "[123]") String vote
) {
}
