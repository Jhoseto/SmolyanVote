package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

/** POST /api/v1/signals/{id}/like */
public record SignalReactionResponse(boolean isLiked, int likesCount) {
}
