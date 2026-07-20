package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

/** POST /api/v1/publications/{id}/like|dislike — full reaction state after the toggle (like/dislike are mutually exclusive server-side). */
public record PublicationReactionResponse(boolean isLiked, boolean isDisliked, int likesCount, int dislikesCount) {
}
