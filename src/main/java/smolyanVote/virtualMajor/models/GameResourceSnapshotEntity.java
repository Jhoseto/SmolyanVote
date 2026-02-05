package smolyanVote.virtualMajor.models;

import jakarta.persistence.*;
import smolyanVote.smolyanVote.models.BaseEntity;

import java.time.Instant;

/**
 * Entity representing a snapshot of game resources at a specific point in time.
 * Used for generating charts and strategic analysis.
 */
@Entity
@Table(name = "game_resource_snapshots", indexes = {
        @Index(name = "idx_snapshot_session_time", columnList = "session_id, month_occurred, year_occurred")
})
public class GameResourceSnapshotEntity extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private GameSessionEntity session;

    @Column(name = "month_occurred", nullable = false)
    private Integer month;

    @Column(name = "year_occurred", nullable = false)
    private Integer year;

    @Column(name = "budget", nullable = false)
    private Integer budget;

    @Column(name = "trust", nullable = false)
    private Integer trust;

    @Column(name = "population", nullable = false)
    private Integer population;

    @Column(name = "innovation", nullable = false)
    private Integer innovation;

    @Column(name = "eco", nullable = false)
    private Integer eco;

    @Column(name = "infrastructure", nullable = false)
    private Integer infrastructure;

    @Column(name = "timestamp", nullable = false)
    private Instant timestamp;

    public GameResourceSnapshotEntity() {
        this.timestamp = Instant.now();
    }

    // Getters and Setters
    public GameSessionEntity getSession() {
        return session;
    }

    public void setSession(GameSessionEntity session) {
        this.session = session;
    }

    public Integer getMonth() {
        return month;
    }

    public void setMonth(Integer month) {
        this.month = month;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public Integer getBudget() {
        return budget;
    }

    public void setBudget(Integer budget) {
        this.budget = budget;
    }

    public Integer getTrust() {
        return trust;
    }

    public void setTrust(Integer trust) {
        this.trust = trust;
    }

    public Integer getPopulation() {
        return population;
    }

    public void setPopulation(Integer population) {
        this.population = population;
    }

    public Integer getInnovation() {
        return innovation;
    }

    public void setInnovation(Integer innovation) {
        this.innovation = innovation;
    }

    public Integer getEco() {
        return eco;
    }

    public void setEco(Integer eco) {
        this.eco = eco;
    }

    public Integer getInfrastructure() {
        return infrastructure;
    }

    public void setInfrastructure(Integer infrastructure) {
        this.infrastructure = infrastructure;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }
}
