package smolyanVote.virtualMajor.models;

import jakarta.persistence.*;
import smolyanVote.smolyanVote.models.BaseEntity;
import smolyanVote.smolyanVote.models.UserEntity;

import java.time.Instant;

/**
 * Entity representing aggregated statistics for a user across all completed
 * games.
 * Used for tracking achievements, high scores, and overall game performance.
 */
@Entity
@Table(name = "game_statistics", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "user_id" })
})
public class GameStatisticsEntity extends BaseEntity {

    /**
     * The user these statistics belong to
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private UserEntity user;

    // ===== GAME COUNTERS =====

    /**
     * Total number of games started by the user
     */
    @Column(name = "total_games_played", nullable = false)
    private Integer totalGamesPlayed;

    /**
     * Total number of games won (successful completion)
     */
    @Column(name = "total_games_won", nullable = false)
    private Integer totalGamesWon;

    /**
     * Total number of games lost (game over conditions)
     */
    @Column(name = "total_games_lost", nullable = false)
    private Integer totalGamesLost;

    // ===== RECORDS / HIGH SCORES =====

    /**
     * Longest game duration in months
     */
    @Column(name = "longest_game_months", nullable = false)
    private Integer longestGameMonths;

    /**
     * Highest population ever achieved
     */
    @Column(name = "highest_population", nullable = false)
    private Integer highestPopulation;

    /**
     * Highest budget ever achieved
     */
    @Column(name = "highest_budget", nullable = false)
    private Integer highestBudget;

    /**
     * Highest trust level ever achieved
     */
    @Column(name = "highest_trust", nullable = false)
    private Integer highestTrust;

    /**
     * Highest innovation level ever achieved
     */
    @Column(name = "highest_innovation", nullable = false)
    private Integer highestInnovation;

    /**
     * Last time these statistics were updated
     */
    @Column(name = "last_updated", nullable = false)
    private Instant lastUpdated;

    // ===== CONSTRUCTORS =====

    public GameStatisticsEntity() {
        this.totalGamesPlayed = 0;
        this.totalGamesWon = 0;
        this.totalGamesLost = 0;
        this.longestGameMonths = 0;
        this.highestPopulation = 0;
        this.highestBudget = 0;
        this.highestTrust = 0;
        this.highestInnovation = 0;
        this.lastUpdated = Instant.now();
    }

    // ===== GETTERS AND SETTERS =====

    public UserEntity getUser() {
        return user;
    }

    public GameStatisticsEntity setUser(UserEntity user) {
        this.user = user;
        return this;
    }

    public Integer getTotalGamesPlayed() {
        return totalGamesPlayed;
    }

    public GameStatisticsEntity setTotalGamesPlayed(Integer totalGamesPlayed) {
        this.totalGamesPlayed = totalGamesPlayed;
        return this;
    }

    public Integer getTotalGamesWon() {
        return totalGamesWon;
    }

    public GameStatisticsEntity setTotalGamesWon(Integer totalGamesWon) {
        this.totalGamesWon = totalGamesWon;
        return this;
    }

    public Integer getTotalGamesLost() {
        return totalGamesLost;
    }

    public GameStatisticsEntity setTotalGamesLost(Integer totalGamesLost) {
        this.totalGamesLost = totalGamesLost;
        return this;
    }

    public Integer getLongestGameMonths() {
        return longestGameMonths;
    }

    public GameStatisticsEntity setLongestGameMonths(Integer longestGameMonths) {
        this.longestGameMonths = longestGameMonths;
        return this;
    }

    public Integer getHighestPopulation() {
        return highestPopulation;
    }

    public GameStatisticsEntity setHighestPopulation(Integer highestPopulation) {
        this.highestPopulation = highestPopulation;
        return this;
    }

    public Integer getHighestBudget() {
        return highestBudget;
    }

    public GameStatisticsEntity setHighestBudget(Integer highestBudget) {
        this.highestBudget = highestBudget;
        return this;
    }

    public Integer getHighestTrust() {
        return highestTrust;
    }

    public GameStatisticsEntity setHighestTrust(Integer highestTrust) {
        this.highestTrust = highestTrust;
        return this;
    }

    public Integer getHighestInnovation() {
        return highestInnovation;
    }

    public GameStatisticsEntity setHighestInnovation(Integer highestInnovation) {
        this.highestInnovation = highestInnovation;
        return this;
    }

    public Instant getLastUpdated() {
        return lastUpdated;
    }

    public GameStatisticsEntity setLastUpdated(Instant lastUpdated) {
        this.lastUpdated = lastUpdated;
        return this;
    }
}
