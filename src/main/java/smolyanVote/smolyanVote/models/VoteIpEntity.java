package smolyanVote.smolyanVote.models;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "vote_ips", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"ip_address", "event_id"})  // Един IP може да гласува само 3 пъти за едно събитие
})
public class VoteIpEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private EventEntity event;

    @Column(nullable = false)
    private String ipAddress;  // IP адрес на потребителя

    private Instant votedAt = Instant.now();  // Време на гласуване





    public Long getId() {return id;}

    public void setId(Long id) {this.id = id;}

    public EventEntity getEvent() {return event;}

    public void setEvent(EventEntity event) {this.event = event;}

    public String getIpAddress() {return ipAddress;}

    public void setIpAddress(String ipAddress) {this.ipAddress = ipAddress;}

    public Instant getVotedAt() {return votedAt;}

    public void setVotedAt(Instant votedAt) {this.votedAt = votedAt;}
}
