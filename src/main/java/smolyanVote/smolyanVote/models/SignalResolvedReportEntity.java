package smolyanVote.smolyanVote.models;

import jakarta.persistence.*;
import java.time.Instant;

/** User reports that a signal appears resolved (2+ unique reports → admin notification). */
@Entity
@Table(name = "signal_resolved_reports", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "user_id", "signal_id" })
})
public class SignalResolvedReportEntity {

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

    public SignalResolvedReportEntity() {
    }

    public SignalResolvedReportEntity(UserEntity user, SignalsEntity signal) {
        this.user = user;
        this.signal = signal;
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public UserEntity getUser() { return user; }
    public SignalsEntity getSignal() { return signal; }
    public Instant getCreatedAt() { return createdAt; }
}
