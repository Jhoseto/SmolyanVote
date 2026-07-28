package smolyanVote.smolyanVote.models.svmessenger;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import smolyanVote.smolyanVote.models.UserEntity;

import java.time.LocalDateTime;

@Entity
@Table(name = "sv_conversations", indexes = {
        @Index(name = "idx_sv_conv_users", columnList = "user1_id, user2_id"),
        @Index(name = "idx_sv_conv_updated", columnList = "updated_at")
})
@Getter
@Setter
@NoArgsConstructor
public class SVConversationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ✅ FIX: LAZY fetching за performance
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user1_id", nullable = false)
    private UserEntity user1;

    // ✅ FIX: LAZY fetching за performance
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user2_id", nullable = false)
    private UserEntity user2;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "last_message_preview", columnDefinition = "TEXT")
    private String lastMessagePreview;

    @Column(name = "user1_unread_count", nullable = false)
    private Integer user1UnreadCount = 0;

    @Column(name = "user2_unread_count", nullable = false)
    private Integer user2UnreadCount = 0;

    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    // ✅ FIX: Едностранно hiding - отделно за всеки потребител
    @Column(name = "user1_hidden", nullable = false)
    private Boolean user1Hidden = false;

    @Column(name = "user2_hidden", nullable = false)
    private Boolean user2Hidden = false;

    // Legacy field - оставяме за backward compatibility, но не го използваме
    @Column(name = "is_hidden", nullable = false)
    private Boolean isHidden = false;

    // Заглушаване — известията спират, но разговорът остава в списъка
    @Column(name = "user1_muted", nullable = false)
    private Boolean user1Muted = false;

    @Column(name = "user2_muted", nullable = false)
    private Boolean user2Muted = false;

    // ------------------------------------------------------------- групи
    // За GROUP разговорите user1 и user2 сочат създателя, за да останат
    // NOT NULL колоните валидни. Реалният състав е в sv_conversation_participants.

    @Enumerated(EnumType.STRING)
    @Column(name = "conversation_type", nullable = false, length = 16)
    private ConversationType conversationType = ConversationType.DIRECT;

    @Column(name = "title", length = 120)
    private String title;

    @Column(name = "image_url", length = 512)
    private String imageUrl;

    public boolean isGroup() {
        return conversationType == ConversationType.GROUP;
    }

    /** Group conversations park the creator in both legacy user slots. */
    public static SVConversationEntity newGroup(UserEntity creator, String title) {
        SVConversationEntity conversation = new SVConversationEntity();
        conversation.user1 = creator;
        conversation.user2 = creator;
        conversation.conversationType = ConversationType.GROUP;
        conversation.title = title;
        conversation.createdAt = LocalDateTime.now();
        conversation.updatedAt = LocalDateTime.now();
        return conversation;
    }

    // Business methods остават същите
    public UserEntity getOtherUser(UserEntity currentUser) {
        if (currentUser.getId().equals(user1.getId())) {
            return user2;
        } else if (currentUser.getId().equals(user2.getId())) {
            return user1;
        }
        throw new IllegalArgumentException("User is not part of this conversation");
    }

    public Integer getUnreadCountFor(UserEntity user) {
        if (user.getId().equals(user1.getId())) {
            return user1UnreadCount;
        } else if (user.getId().equals(user2.getId())) {
            return user2UnreadCount;
        }
        return 0;
    }

    public void incrementUnreadFor(UserEntity user) {
        if (user.getId().equals(user1.getId())) {
            user1UnreadCount++;
        } else if (user.getId().equals(user2.getId())) {
            user2UnreadCount++;
        }
    }

    public void resetUnreadFor(UserEntity user) {
        if (user.getId().equals(user1.getId())) {
            user1UnreadCount = 0;
        } else if (user.getId().equals(user2.getId())) {
            user2UnreadCount = 0;
        }
    }

    public boolean isParticipant(UserEntity user) {
        return user.getId().equals(user1.getId()) || user.getId().equals(user2.getId());
    }

    // ✅ NEW: Едностранно hiding методи
    public boolean isHiddenForUser(UserEntity user) {
        if (user.getId().equals(user1.getId())) {
            return user1Hidden;
        } else if (user.getId().equals(user2.getId())) {
            return user2Hidden;
        }
        return false;
    }

    public void hideForUser(UserEntity user) {
        if (user.getId().equals(user1.getId())) {
            user1Hidden = true;
        } else if (user.getId().equals(user2.getId())) {
            user2Hidden = true;
        }
    }

    public boolean isMutedForUser(UserEntity user) {
        if (user.getId().equals(user1.getId())) {
            return Boolean.TRUE.equals(user1Muted);
        } else if (user.getId().equals(user2.getId())) {
            return Boolean.TRUE.equals(user2Muted);
        }
        return false;
    }

    /** Returns the new state. */
    public boolean toggleMuteForUser(UserEntity user) {
        if (user.getId().equals(user1.getId())) {
            user1Muted = !Boolean.TRUE.equals(user1Muted);
            return user1Muted;
        } else if (user.getId().equals(user2.getId())) {
            user2Muted = !Boolean.TRUE.equals(user2Muted);
            return user2Muted;
        }
        return false;
    }

    public void unhideForUser(UserEntity user) {
        if (user.getId().equals(user1.getId())) {
            user1Hidden = false;
        } else if (user.getId().equals(user2.getId())) {
            user2Hidden = false;
        }
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (user1UnreadCount == null)
            user1UnreadCount = 0;
        if (user2UnreadCount == null)
            user2UnreadCount = 0;
        if (isDeleted == null)
            isDeleted = false;
        if (isHidden == null)
            isHidden = false;
        if (user1Muted == null)
            user1Muted = false;
        if (user2Muted == null)
            user2Muted = false;
        if (conversationType == null)
            conversationType = ConversationType.DIRECT;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public SVConversationEntity(UserEntity userA, UserEntity userB) {
        if (userA.getId() < userB.getId()) {
            this.user1 = userA;
            this.user2 = userB;
        } else {
            this.user1 = userB;
            this.user2 = userA;
        }
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        this.user1UnreadCount = 0;
        this.user2UnreadCount = 0;
        this.isDeleted = false;
        this.isHidden = false;
    }
}