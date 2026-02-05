package smolyanVote.virtualMajor.models;

import jakarta.persistence.*;
import smolyanVote.smolyanVote.models.BaseEntity;
import smolyanVote.virtualMajor.models.enums.GameEventType;

import java.time.Instant;

/**
 * Entity representing a single event that occurred during a game session.
 * Tracks detailed history of all player actions and AI-generated events.
 */
@Entity
@Table(name = "game_event_history", indexes = {
        @Index(name = "idx_session_timestamp", columnList = "session_id,timestamp")
})
public class GameEventHistoryEntity extends BaseEntity {

    /**
     * The game session this event belongs to
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private GameSessionEntity session;

    /**
     * Month when the event occurred (1-12)
     */
    @Column(name = "month_occurred", nullable = false)
    private Integer monthOccurred;

    /**
     * Year when the event occurred
     */
    @Column(name = "year_occurred", nullable = false)
    private Integer yearOccurred;

    /**
     * Exact timestamp when the event was recorded
     */
    @Column(name = "timestamp", nullable = false)
    private Instant timestamp;

    /**
     * Type of event (categorization)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 50)
    private GameEventType eventType;

    /**
     * Title/summary of the event
     */
    @Column(name = "event_title", nullable = false, length = 200)
    private String eventTitle;

    /**
     * Detailed description of the event
     */
    @Column(name = "event_description", columnDefinition = "TEXT")
    private String eventDescription;

    /**
     * JSON representation of the impact this event had on resources
     * Structure: {budget: +/-value, trust: +/-value, ...}
     */
    @Column(name = "impact_json", columnDefinition = "JSON")
    private String impactJson;

    // ===== CONSTRUCTORS =====

    public GameEventHistoryEntity() {
        this.timestamp = Instant.now();
    }

    // ===== GETTERS AND SETTERS =====

    public GameSessionEntity getSession() {
        return session;
    }

    public GameEventHistoryEntity setSession(GameSessionEntity session) {
        this.session = session;
        return this;
    }

    public Integer getMonthOccurred() {
        return monthOccurred;
    }

    public GameEventHistoryEntity setMonthOccurred(Integer monthOccurred) {
        this.monthOccurred = monthOccurred;
        return this;
    }

    public Integer getYearOccurred() {
        return yearOccurred;
    }

    public GameEventHistoryEntity setYearOccurred(Integer yearOccurred) {
        this.yearOccurred = yearOccurred;
        return this;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public GameEventHistoryEntity setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
        return this;
    }

    public GameEventType getEventType() {
        return eventType;
    }

    public GameEventHistoryEntity setEventType(GameEventType eventType) {
        this.eventType = eventType;
        return this;
    }

    public String getEventTitle() {
        return eventTitle;
    }

    public GameEventHistoryEntity setEventTitle(String eventTitle) {
        this.eventTitle = eventTitle;
        return this;
    }

    public String getEventDescription() {
        return eventDescription;
    }

    public GameEventHistoryEntity setEventDescription(String eventDescription) {
        this.eventDescription = eventDescription;
        return this;
    }

    public String getImpactJson() {
        return impactJson;
    }

    public GameEventHistoryEntity setImpactJson(String impactJson) {
        this.impactJson = impactJson;
        return this;
    }
}
