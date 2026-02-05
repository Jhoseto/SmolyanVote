package smolyanVote.virtualMajor.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import smolyanVote.virtualMajor.models.GameSessionEntity;

import java.util.List;
import java.util.Optional;

/**
 * Repository for managing game session data access.
 * Provides queries for finding active and historical game sessions.
 */
@Repository
public interface GameSessionRepository extends JpaRepository<GameSessionEntity, Long> {

    /**
     * Find the active game session for a specific user.
     * Only one active session per user is allowed.
     *
     * @param userId the ID of the user
     * @return Optional containing the active game session if it exists
     */
    Optional<GameSessionEntity> findByUserIdAndIsActiveTrue(Long userId);

    /**
     * Find all game sessions for a specific user, ordered by last played date (most
     * recent first).
     *
     * @param userId the ID of the user
     * @return List of game sessions
     */
    List<GameSessionEntity> findAllByUserIdOrderByLastPlayedDesc(Long userId);

    /**
     * Check if a user has an active game session.
     *
     * @param userId the ID of the user
     * @return true if an active session exists, false otherwise
     */
    boolean existsByUserIdAndIsActiveTrue(Long userId);
}
