package smolyanVote.smolyanVote.services.interfaces;

import smolyanVote.smolyanVote.viewsAndDTO.apiv1.HomeStatsResponse;

/**
 * Provides aggregate counters shown on the public home page.
 */
public interface HomeStatsService {

    HomeStatsResponse getHomeStats();
}
