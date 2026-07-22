package smolyanVote.smolyanVote.models;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "signal_subscriptions", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "user_id", "signal_id" })
})
public class SignalSubscriptionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "signal_id", nullable = false)
    private SignalsEntity signal;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public SignalSubscriptionEntity() {
    }

    public SignalSubscriptionEntity(UserEntity user, SignalsEntity signal) {
        this.user = user;
        this.signal = signal;
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public UserEntity getUser() { return user; }
    public SignalsEntity getSignal() { return signal; }
    public Instant getCreatedAt() { return createdAt; }
}
