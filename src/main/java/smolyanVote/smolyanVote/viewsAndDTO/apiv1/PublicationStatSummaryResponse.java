package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

/**
 * GET /api/v1/publications/sidebar/most-commented, top-viewed, from-admin —
 * includes cover {@code imageUrl} for card thumbnails.
 */
public record PublicationStatSummaryResponse(
        Long id,
        String title,
        long commentsCount,
        long viewsCount,
        long likesCount,
        Long authorId,
        String authorName,
        String authorImage,
        String imageUrl) {
}
