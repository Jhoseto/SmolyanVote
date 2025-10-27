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

    @Column(name = "last_message_preview", length = 100)
    private String lastMessagePreview;

    @Column(name = "user1_unread_count", nullable = false)
    private Integer user1UnreadCount = 0;

    @Column(name = "user2_unread_count", nullable = false)
    private Integer user2UnreadCount = 0;

    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    @Column(name = "is_hidden", nullable = false)
    private Boolean isHidden = false;

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

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (user1UnreadCount == null) user1UnreadCount = 0;
        if (user2UnreadCount == null) user2UnreadCount = 0;
        if (isDeleted == null) isDeleted = false;
        if (isHidden == null) isHidden = false;
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