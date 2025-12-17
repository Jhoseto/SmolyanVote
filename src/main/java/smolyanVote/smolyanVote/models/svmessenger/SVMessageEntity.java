package smolyanVote.smolyanVote.models.svmessenger;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import smolyanVote.smolyanVote.models.UserEntity;

import java.time.LocalDateTime;

@Entity
@Table(name = "sv_messages", indexes = {
        @Index(name = "idx_sv_msg_conversation_sent", columnList = "conversation_id, sent_at"),
        @Index(name = "idx_sv_msg_unread", columnList = "conversation_id, is_read, sender_id")
})
@Getter
@Setter
@NoArgsConstructor
public class SVMessageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ✅ FIX: LAZY е OK, но трябва @Transactional в service
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private SVConversationEntity conversation;

    // ✅ FIX: LAZY за sender също
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private UserEntity sender;

    @Column(name = "message_text", columnDefinition = "TEXT", nullable = false)
    private String messageText;

    @Column(name = "sent_at", nullable = false, updatable = false)
    private LocalDateTime sentAt;

    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", length = 20, nullable = false)
    private MessageType messageType = MessageType.TEXT;

    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    @Column(name = "is_edited", nullable = false)
    private Boolean isEdited = false;

    @Column(name = "edited_at")
    private LocalDateTime editedAt;

    @Column(name = "is_delivered", nullable = false)
    private Boolean isDelivered = false;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    // Reply to message support
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_message_id")
    private SVMessageEntity parentMessage;

    public void markAsRead() {
        if (!this.isRead) {
            this.isRead = true;
            this.readAt = LocalDateTime.now();
        }
    }

    public void markAsDelivered() {
        if (!this.isDelivered) {
            this.isDelivered = true;
            this.deliveredAt = LocalDateTime.now();
        }
    }

    public boolean isSentBy(UserEntity user) {
        return this.sender.getId().equals(user.getId());
    }

    public boolean isReceivedBy(UserEntity user) {
        return this.conversation.isParticipant(user) && !isSentBy(user);
    }

    @PrePersist
    protected void onCreate() {
        sentAt = LocalDateTime.now();
        if (isRead == null) isRead = false;
        if (isDeleted == null) isDeleted = false;
        if (isEdited == null) isEdited = false;
        if (messageType == null) messageType = MessageType.TEXT;
    }

    public SVMessageEntity(SVConversationEntity conversation, UserEntity sender, String messageText) {
        this.conversation = conversation;
        this.sender = sender;
        this.messageText = messageText;
        this.sentAt = LocalDateTime.now();
        this.isRead = false;
        this.isDeleted = false;
        this.isEdited = false;
        this.messageType = MessageType.TEXT;
    }
}