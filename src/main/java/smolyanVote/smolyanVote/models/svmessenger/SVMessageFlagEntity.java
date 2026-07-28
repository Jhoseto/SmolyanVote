package smolyanVote.smolyanVote.models.svmessenger;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import smolyanVote.smolyanVote.models.UserEntity;

import java.time.LocalDateTime;

/**
 * Закачени и запазени съобщения. Двете състояния делят една таблица, защото
 * имат идентична форма — (съобщение, потребител, вид).
 */
@Entity
@Table(name = "sv_message_flags",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_sv_flag_message_user_kind",
                columnNames = {"message_id", "user_id", "flag_kind"}),
        indexes = {
                @Index(name = "idx_sv_flag_conversation", columnList = "conversation_id, flag_kind"),
                @Index(name = "idx_sv_flag_user", columnList = "user_id, flag_kind")
        })
@Getter
@Setter
@NoArgsConstructor
public class SVMessageFlagEntity {

    public enum Kind {
        PINNED,
        STARRED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    private SVMessageEntity message;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    /** Denormalised so "pinned in this conversation" is a single indexed lookup. */
    @Column(name = "conversation_id", nullable = false)
    private Long conversationId;

    @Enumerated(EnumType.STRING)
    @Column(name = "flag_kind", length = 16, nullable = false)
    private Kind kind;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public SVMessageFlagEntity(SVMessageEntity message, UserEntity user, Kind kind) {
        this.message = message;
        this.user = user;
        this.conversationId = message.getConversation().getId();
        this.kind = kind;
        this.createdAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
