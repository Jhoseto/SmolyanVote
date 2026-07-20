package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

/** POST /api/v1/publications/{id}/share — anonymous-friendly, mirrors legacy (no auth required to record a share). */
public record PublicationShareResponse(int sharesCount) {
}
