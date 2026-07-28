package smolyanVote.smolyanVote.models.svmessenger;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import smolyanVote.smolyanVote.models.UserEntity;

import java.time.LocalDateTime;

/**
 * Глас в чат анкета. Уникалността е на ниво съобщение, за да може смяна на
 * избора без дублиране.
 */
@Entity
@Table(name = "sv_message_poll_votes",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_sv_poll_vote_message_user",
                columnNames = {"message_id", "user_id"}),
        indexes = @Index(name = "idx_sv_poll_vote_option", columnList = "option_id"))
@Getter
@Setter
@NoArgsConstructor
public class SVMessagePollVoteEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "option_id", nullable = false)
    private SVMessagePollOptionEntity option;

    @Column(name = "message_id", nullable = false)
    private Long messageId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public SVMessagePollVoteEntity(SVMessagePollOptionEntity option, UserEntity user) {
        this.option = option;
        this.messageId = option.getMessage().getId();
        this.user = user;
        this.createdAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
