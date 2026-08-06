package smolyanVote.smolyanVote.models;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "vote_ips", indexes = {
        @Index(name = "idx_ip_event", columnList = "ip_address,event_id,event_type")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_vote_ip_user_event", columnNames = {"user_id", "event_id", "event_type"})
})
public class VoteIpEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String ipAddress;

    @Column(nullable = false)
    private Long eventId;

    @Column(nullable = false, length = 20)
    private String eventType;

    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false)
    private Instant votedAt = Instant.now();

    public VoteIpEntity() {}

    public VoteIpEntity(String ipAddress, Long eventId, String eventType) {
        this(ipAddress, eventId, eventType, null);
    }

    public VoteIpEntity(String ipAddress, Long eventId, String eventType, Long userId) {
        this.ipAddress = ipAddress;
        this.eventId = eventId;
        this.eventType = eventType;
        this.userId = userId;
        this.votedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public Long getEventId() {
        return eventId;
    }

    public void setEventId(Long eventId) {
        this.eventId = eventId;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Instant getVotedAt() {
        return votedAt;
    }

    public void setVotedAt(Instant votedAt) {
        this.votedAt = votedAt;
    }
}
