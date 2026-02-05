package smolyanVote.virtualMajor.services.interfaces;

import smolyanVote.virtualMajor.viewsAndDTO.GameStatisticsDTO;

/**
 * Service interface for managing game statistics.
 * Tracks user achievements and high scores across all games.
 */
public interface GameStatisticsService {

    /**
     * Get statistics for a user.
     * Creates initial statistics if none exist.
     *
     * @param userId the ID of the user
     * @return GameStatisticsDTO containing user's statistics
     */
    GameStatisticsDTO getUserStatistics(Long userId);

    /**
     * Update statistics when a game ends.
     * Records game outcome and updates high scores if applicable.
     *
     * @param userId  the ID of the user
     * @param session the completed game session
     * @param won     whether the game was won or lost
     */
    void updateStatisticsOnGameEnd(Long userId, smolyanVote.virtualMajor.models.GameSessionEntity session, Boolean won);

    /**
     * Check and update high scores based on final game state.
     *
     * @param userId  the ID of the user
     * @param session the completed game session
     */
    void updateHighScores(Long userId, smolyanVote.virtualMajor.models.GameSessionEntity session);
}
