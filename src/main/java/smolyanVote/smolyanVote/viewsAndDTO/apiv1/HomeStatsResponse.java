package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

/**
 * Home page counters for the new Next.js frontend (GET /api/v1/stats/home).
 * Field names match the frontend contract in features/shell/hooks/useHomeStats.ts.
 */
public record HomeStatsResponse(
        long usersCount,
        long simpleEventsCount,
        long referendumsCount,
        long multiPollsCount
) {
}
