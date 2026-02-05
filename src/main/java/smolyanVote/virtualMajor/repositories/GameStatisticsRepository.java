package smolyanVote.virtualMajor.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import smolyanVote.virtualMajor.models.GameStatisticsEntity;

import java.util.Optional;

/**
 * Repository for managing game statistics data access.
 * Provides queries for user statistics and leaderboard data.
 */
@Repository
public interface GameStatisticsRepository extends JpaRepository<GameStatisticsEntity, Long> {

    /**
     * Find statistics for a specific user.
     *
     * @param userId the ID of the user
     * @return Optional containing the statistics if they exist
     */
    Optional<GameStatisticsEntity> findByUserId(Long userId);

    /**
     * Check if statistics exist for a user.
     *
     * @param userId the ID of the user
     * @return true if statistics exist, false otherwise
     */
    boolean existsByUserId(Long userId);
}
