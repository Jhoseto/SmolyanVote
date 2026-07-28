package smolyanVote.smolyanVote.models.svmessenger;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import smolyanVote.smolyanVote.models.UserEntity;

import java.time.LocalDateTime;

/**
 * Membership row for a GROUP conversation. DIRECT conversations keep using the
 * user1/user2 columns on {@link SVConversationEntity} and have no rows here, so
 * existing one-to-one chats and the mobile client are unaffected.
 */
@Entity
@Table(name = "sv_conversation_participants", uniqueConstraints = {
        @UniqueConstraint(name = "uk_sv_participant", columnNames = {"conversation_id", "user_id"})
}, indexes = {
        @Index(name = "idx_sv_participant_user", columnList = "user_id"),
        @Index(name = "idx_sv_participant_conversation", columnList = "conversation_id")
})
@Getter
@Setter
@NoArgsConstructor
public class SVConversationParticipantEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private SVConversationEntity conversation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 16)
    private ParticipantRole role = ParticipantRole.MEMBER;

    @Column(name = "unread_count", nullable = false)
    private Integer unreadCount = 0;

    @Column(name = "muted", nullable = false)
    private Boolean muted = false;

    @Column(name = "hidden", nullable = false)
    private Boolean hidden = false;

    @Column(name = "joined_at", nullable = false)
    private LocalDateTime joinedAt;

    /** Non-null once the member leaves or is removed; the row is kept for history. */
    @Column(name = "left_at")
    private LocalDateTime leftAt;

    public SVConversationParticipantEntity(SVConversationEntity conversation, UserEntity user, ParticipantRole role) {
        this.conversation = conversation;
        this.user = user;
        this.role = role;
        this.joinedAt = LocalDateTime.now();
    }

    public boolean isActive() {
        return leftAt == null;
    }

    public boolean canManage() {
        return role == ParticipantRole.OWNER || role == ParticipantRole.ADMIN;
    }

    @PrePersist
    protected void onCreate() {
        if (joinedAt == null) joinedAt = LocalDateTime.now();
        if (unreadCount == null) unreadCount = 0;
        if (muted == null) muted = false;
        if (hidden == null) hidden = false;
        if (role == null) role = ParticipantRole.MEMBER;
    }
}
