package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

/** GET /api/v1/publications/sidebar/stats */
public record PublicationsSidebarStatsResponse(long totalPublications, long todayPublications,
                                                 long weekPublications, long onlineUsers) {
}
