package smolyanVote.smolyanVote.models.svmessenger;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import smolyanVote.smolyanVote.models.UserEntity;

import java.time.Instant;

/**
 * Entity за едно съобщение в SVMessenger
 * 
 * Бизнес правила:
 * - Съобщенията се четат само от recipient
 * - Sender не може да промени is_read
 * - Soft delete (не се изтриват истински)
 * - Максимална дължина на текст: 5000 chars
 */
@Entity
@Table(name = "sv_messages")
@Getter
@Setter
@NoArgsConstructor
public class SVMessageEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * Разговорът към който принадлежи съобщението
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private SVConversationEntity conversation;
    
    /**
     * Изпращач на съобщението
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sender_id", nullable = false)
    private UserEntity sender;
    
    /**
     * Текст на съобщението
     */
    @Column(name = "message_text", columnDefinition = "TEXT", nullable = false)
    private String messageText;
    
    /**
     * Кога е изпратено
     */
    @Column(name = "sent_at", nullable = false, updatable = false)
    private Instant sentAt;
    
    /**
     * Дали е прочетено от получателя
     */
    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;
    
    /**
     * Кога е прочетено
     */
    @Column(name = "read_at")
    private Instant readAt;
    
    /**
     * Тип на съобщението
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", length = 20, nullable = false)
    private MessageType messageType = MessageType.TEXT;
    
    /**
     * Soft delete flag
     */
    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;
    
    /**
     * Дали е редактирано
     */
    @Column(name = "is_edited", nullable = false)
    private Boolean isEdited = false;
    
    /**
     * Кога е редактирано
     */
    @Column(name = "edited_at")
    private Instant editedAt;
    
    // ========== BUSINESS LOGIC METHODS ==========
    
    /**
     * Маркира съобщението като прочетено
     */
    public void markAsRead() {
        if (!this.isRead) {
            this.isRead = true;
            this.readAt = Instant.now();
        }
    }
    
    /**
     * Проверява дали sender е конкретен user
     */
    public boolean isSentBy(UserEntity user) {
        return this.sender.getId().equals(user.getId());
    }
    
    /**
     * Проверява дали user е receiver на това съобщение
     */
    public boolean isReceivedBy(UserEntity user) {
        return this.conversation.isParticipant(user) && !isSentBy(user);
    }
    
    // ========== LIFECYCLE CALLBACKS ==========
    
    @PrePersist
    protected void onCreate() {
        sentAt = Instant.now();
        
        if (isRead == null) isRead = false;
        if (isDeleted == null) isDeleted = false;
        if (isEdited == null) isEdited = false;
        if (messageType == null) messageType = MessageType.TEXT;
    }
    
    // ========== CONSTRUCTOR ==========
    
    public SVMessageEntity(SVConversationEntity conversation, UserEntity sender, String messageText) {
        this.conversation = conversation;
        this.sender = sender;
        this.messageText = messageText;
        this.sentAt = Instant.now();
        this.isRead = false;
        this.isDeleted = false;
        this.isEdited = false;
        this.messageType = MessageType.TEXT;
    }
}
