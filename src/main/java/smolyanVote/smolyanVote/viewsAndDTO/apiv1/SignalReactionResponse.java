package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

/** POST /api/v1/signals/{id}/boost */
public record SignalReactionResponse(boolean hasBoosted, int priorityBoostCount) {
}
