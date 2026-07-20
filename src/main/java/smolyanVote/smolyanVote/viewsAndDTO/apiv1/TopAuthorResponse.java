package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

/** One row of GET /api/v1/publications/sidebar/top-authors (today's most active authors). */
public record TopAuthorResponse(Long id, String username, String imageUrl, long publicationsCount,
                                  boolean isFollowing) {
}
