package smolyanVote.smolyanVote.models;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "vote_ips", indexes = {
        @Index(name = "idx_ip_event", columnList = "ip_address,event_id,event_type")
})
public class VoteIpEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String ipAddress;  // IP адрес на потребителя

    @Column(nullable = false)
    private Long eventId;  // ID на събитието (SimpleEvent, Referendum или MultiPoll)

    @Column(nullable = false, length = 20)
    private String eventType;  // Тип събитие: "SIMPLE_EVENT", "REFERENDUM", "MULTI_POLL"

    @Column(nullable = false)
    private Instant votedAt = Instant.now();  // Време на гласуване

    // Конструктори
    public VoteIpEntity() {}

    public VoteIpEntity(String ipAddress, Long eventId, String eventType) {
        this.ipAddress = ipAddress;
        this.eventId = eventId;
        this.eventType = eventType;
        this.votedAt = Instant.now();
    }

    // Getters и Setters
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

    public Instant getVotedAt() {
        return votedAt;
    }

    public void setVotedAt(Instant votedAt) {
        this.votedAt = votedAt;
    }
}
