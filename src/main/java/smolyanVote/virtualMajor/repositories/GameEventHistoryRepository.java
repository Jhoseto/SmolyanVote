package smolyanVote.virtualMajor.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import smolyanVote.virtualMajor.models.GameEventHistoryEntity;

import java.util.List;

/**
 * Repository for managing game event history data access.
 * Provides queries for retrieving event history for game sessions.
 */
@Repository
public interface GameEventHistoryRepository extends JpaRepository<GameEventHistoryEntity, Long> {

    /**
     * Find all events for a specific game session, ordered by timestamp (most
     * recent first).
     *
     * @param sessionId the ID of the game session
     * @return List of event history entries
     */
    List<GameEventHistoryEntity> findBySessionIdOrderByTimestampDesc(Long sessionId);

    /**
     * Find the most recent N events for a specific game session.
     * Useful for displaying recent activity without loading entire history.
     *
     * @param sessionId the ID of the game session
     * @return List of up to 50 most recent events
     */
    List<GameEventHistoryEntity> findTop50BySessionIdOrderByTimestampDesc(Long sessionId);

    /**
     * Count total events for a specific game session.
     *
     * @param sessionId the ID of the game session
     * @return Total number of events
     */
    long countBySessionId(Long sessionId);
}
