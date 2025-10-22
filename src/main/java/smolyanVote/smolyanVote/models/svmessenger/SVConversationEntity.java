package smolyanVote.smolyanVote.models.svmessenger;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import smolyanVote.smolyanVote.models.UserEntity;

import java.time.Instant;

/**
 * Entity за разговор (conversation) между двама потребители
 * 
 * Бизнес правила:
 * - user1_id винаги е по-малко от user2_id (за уникалност)
 * - Всеки user има си unread count
 * - updated_at се update-ва при всяко ново съобщение
 * - Не се изтрива истински (soft delete)
 */
@Entity
@Table(name = "sv_conversations")
@Getter
@Setter
@NoArgsConstructor
public class SVConversationEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * Първи потребител (винаги с по-малко ID)
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user1_id", nullable = false)
    private UserEntity user1;
    
    /**
     * Втори потребител (винаги с по-голямо ID)
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user2_id", nullable = false)
    private UserEntity user2;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
    
    /**
     * Preview на последното съобщение (за списъка с разговори)
     */
    @Column(name = "last_message_preview", length = 100)
    private String lastMessagePreview;
    
    /**
     * Брой непрочетени съобщения за user1
     */
    @Column(name = "user1_unread_count", nullable = false)
    private Integer user1UnreadCount = 0;
    
    /**
     * Брой непрочетени съобщения за user2
     */
    @Column(name = "user2_unread_count", nullable = false)
    private Integer user2UnreadCount = 0;
    
    /**
     * Soft delete flag
     */
    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;
    
    // ========== BUSINESS LOGIC METHODS ==========
    
    /**
     * Връща другия потребител в разговора
     */
    public UserEntity getOtherUser(UserEntity currentUser) {
        if (currentUser.getId().equals(user1.getId())) {
            return user2;
        } else if (currentUser.getId().equals(user2.getId())) {
            return user1;
        }
        throw new IllegalArgumentException("User is not part of this conversation");
    }
    
    /**
     * Връща броя непрочетени за конкретен user
     */
    public Integer getUnreadCountFor(UserEntity user) {
        if (user.getId().equals(user1.getId())) {
            return user1UnreadCount;
        } else if (user.getId().equals(user2.getId())) {
            return user2UnreadCount;
        }
        return 0;
    }
    
    /**
     * Увеличава непрочетените за конкретен user
     */
    public void incrementUnreadFor(UserEntity user) {
        if (user.getId().equals(user1.getId())) {
            user1UnreadCount++;
        } else if (user.getId().equals(user2.getId())) {
            user2UnreadCount++;
        }
    }
    
    /**
     * Нулира непрочетените за конкретен user
     */
    public void resetUnreadFor(UserEntity user) {
        if (user.getId().equals(user1.getId())) {
            user1UnreadCount = 0;
        } else if (user.getId().equals(user2.getId())) {
            user2UnreadCount = 0;
        }
    }
    
    /**
     * Проверява дали потребител е участник в разговора
     */
    public boolean isParticipant(UserEntity user) {
        return user.getId().equals(user1.getId()) || user.getId().equals(user2.getId());
    }
    
    // ========== LIFECYCLE CALLBACKS ==========
    
    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
        
        if (user1UnreadCount == null) user1UnreadCount = 0;
        if (user2UnreadCount == null) user2UnreadCount = 0;
        if (isDeleted == null) isDeleted = false;
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
    
    // ========== CONSTRUCTOR ==========
    
    /**
     * Конструктор за нов разговор
     * Автоматично нарежда users по ID (по-малък = user1)
     */
    public SVConversationEntity(UserEntity userA, UserEntity userB) {
        if (userA.getId() < userB.getId()) {
            this.user1 = userA;
            this.user2 = userB;
        } else {
            this.user1 = userB;
            this.user2 = userA;
        }
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        this.user1UnreadCount = 0;
        this.user2UnreadCount = 0;
        this.isDeleted = false;
    }
}
