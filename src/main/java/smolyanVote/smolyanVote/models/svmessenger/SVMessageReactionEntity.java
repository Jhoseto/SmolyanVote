package smolyanVote.smolyanVote.models.svmessenger;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import smolyanVote.smolyanVote.models.UserEntity;

import java.time.LocalDateTime;

/**
 * Емоджи реакция върху съобщение. Един потребител може да сложи всяко емоджи
 * най-много веднъж на съобщение.
 */
@Entity
@Table(name = "sv_message_reactions",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_sv_reaction_message_user_emoji",
                columnNames = {"message_id", "user_id", "emoji"}),
        indexes = @Index(name = "idx_sv_reaction_message", columnList = "message_id"))
@Getter
@Setter
@NoArgsConstructor
public class SVMessageReactionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    private SVMessageEntity message;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(name = "emoji", length = 16, nullable = false)
    private String emoji;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public SVMessageReactionEntity(SVMessageEntity message, UserEntity user, String emoji) {
        this.message = message;
        this.user = user;
        this.emoji = emoji;
        this.createdAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
