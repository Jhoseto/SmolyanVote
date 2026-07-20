package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

/**
 * GET /api/v1/publications/sidebar/most-commented (single, nullable) и
 * GET /api/v1/publications/sidebar/top-viewed (list) — и двете носят всички
 * broi (comments/views/likes) едновременно, за да не се дублира DTO-то.
 */
public record PublicationStatSummaryResponse(Long id, String title, long commentsCount, long viewsCount,
                                                long likesCount, Long authorId, String authorName,
                                                String authorImage) {
}
