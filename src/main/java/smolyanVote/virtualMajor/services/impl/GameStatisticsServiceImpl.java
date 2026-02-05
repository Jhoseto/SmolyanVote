package smolyanVote.virtualMajor.services.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.virtualMajor.models.GameSessionEntity;
import smolyanVote.virtualMajor.models.GameStatisticsEntity;
import smolyanVote.virtualMajor.repositories.GameStatisticsRepository;
import smolyanVote.virtualMajor.services.interfaces.GameStatisticsService;
import smolyanVote.virtualMajor.viewsAndDTO.GameStatisticsDTO;

import java.time.Instant;

/**
 * Implementation of GameStatisticsService.
 * Manages user statistics and high scores across all games.
 */
@Service
@Transactional
public class GameStatisticsServiceImpl implements GameStatisticsService {

    private final GameStatisticsRepository gameStatisticsRepository;
    private final UserRepository userRepository;

    public GameStatisticsServiceImpl(GameStatisticsRepository gameStatisticsRepository,
            UserRepository userRepository) {
        this.gameStatisticsRepository = gameStatisticsRepository;
        this.userRepository = userRepository;
    }

    @Override
    public GameStatisticsDTO getUserStatistics(Long userId) {
        GameStatisticsEntity stats = gameStatisticsRepository.findByUserId(userId)
                .orElseGet(() -> createInitialStatistics(userId));

        return convertToDTO(stats);
    }

    @Override
    public void updateStatisticsOnGameEnd(Long userId, GameSessionEntity session, Boolean won) {
        GameStatisticsEntity stats = gameStatisticsRepository.findByUserId(userId)
                .orElseGet(() -> createInitialStatistics(userId));

        // Update counters
        stats.setTotalGamesPlayed(stats.getTotalGamesPlayed() + 1);
        if (won) {
            stats.setTotalGamesWon(stats.getTotalGamesWon() + 1);
        } else {
            stats.setTotalGamesLost(stats.getTotalGamesLost() + 1);
        }

        // Calculate game duration in months
        int gameDuration = (session.getCurrentYear() - 2030) * 12 + session.getCurrentMonth();
        if (gameDuration > stats.getLongestGameMonths()) {
            stats.setLongestGameMonths(gameDuration);
        }

        // Update high scores
        updateHighScores(userId, session);

        stats.setLastUpdated(Instant.now());
        gameStatisticsRepository.save(stats);
    }

    @Override
    public void updateHighScores(Long userId, GameSessionEntity session) {
        GameStatisticsEntity stats = gameStatisticsRepository.findByUserId(userId)
                .orElseGet(() -> createInitialStatistics(userId));

        boolean updated = false;

        if (session.getPopulation() > stats.getHighestPopulation()) {
            stats.setHighestPopulation(session.getPopulation());
            updated = true;
        }

        if (session.getBudget() > stats.getHighestBudget()) {
            stats.setHighestBudget(session.getBudget());
            updated = true;
        }

        if (session.getTrust() > stats.getHighestTrust()) {
            stats.setHighestTrust(session.getTrust());
            updated = true;
        }

        if (session.getInnovation() > stats.getHighestInnovation()) {
            stats.setHighestInnovation(session.getInnovation());
            updated = true;
        }

        if (updated) {
            stats.setLastUpdated(Instant.now());
            gameStatisticsRepository.save(stats);
        }
    }

    private GameStatisticsEntity createInitialStatistics(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        GameStatisticsEntity stats = new GameStatisticsEntity();
        stats.setUser(user);
        return gameStatisticsRepository.save(stats);
    }

    private GameStatisticsDTO convertToDTO(GameStatisticsEntity entity) {
        GameStatisticsDTO dto = new GameStatisticsDTO();
        dto.setTotalGamesPlayed(entity.getTotalGamesPlayed());
        dto.setTotalGamesWon(entity.getTotalGamesWon());
        dto.setTotalGamesLost(entity.getTotalGamesLost());
        dto.setLongestGameMonths(entity.getLongestGameMonths());
        dto.setHighestPopulation(entity.getHighestPopulation());
        dto.setHighestBudget(entity.getHighestBudget());
        dto.setHighestTrust(entity.getHighestTrust());
        dto.setHighestInnovation(entity.getHighestInnovation());
        return dto;
    }
}
