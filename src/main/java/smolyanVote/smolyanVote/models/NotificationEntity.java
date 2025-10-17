package smolyanVote.smolyanVote.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Универсална нотификационна entity за всички типове събития
 * Минимален код - максимална функционалност
 */
@Entity
@Table(name = "notifications", indexes = {
        @Index(name = "idx_notif_recipient", columnList = "recipient_id"),
        @Index(name = "idx_notif_read", columnList = "is_read"),
        @Index(name = "idx_notif_created", columnList = "created_at"),
        @Index(name = "idx_notif_type", columnList = "type")
})
public class NotificationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // КОЙ ПОЛУЧАВА
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private UserEntity recipient;

    // ТИП НОТИФИКАЦИЯ (използваме String за гъвкавост)
    @Column(name = "type", nullable = false, length = 50)
    private String type; // COMMENT, LIKE, MENTION, EVENT_ENDED, PUBLICATION_APPROVED, etc.

    // СЪДЪРЖАНИЕ
    @Column(name = "title", length = 200)
    private String title;

    @Column(name = "message", length = 500, nullable = false)
    private String message;

    // КОЙ НАПРАВИ ДЕЙСТВИЕТО (може да е null за system notifications)
    @Column(name = "actor_username", length = 100)
    private String actorUsername;

    @Column(name = "actor_image_url", length = 500)
    private String actorImageUrl;

    // ENTITY REFERENCE (универсално за всички типове съдържание)
    @Column(name = "entity_type", length = 30)
    private String entityType; // PUBLICATION, COMMENT, EVENT, SIGNAL, etc.

    @Column(name = "entity_id")
    private Long entityId;

    // ACTION URL (директен линк към съдържанието)
    @Column(name = "action_url", length = 500)
    private String actionUrl;

    // СТАТУС
    @Column(name = "is_read", nullable = false)
    private boolean isRead = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    // ПРИОРИТЕТ (опционално)
    @Column(name = "priority", length = 20)
    private String priority = "NORMAL"; // LOW, NORMAL, HIGH, URGENT

    // METADATA (JSON за допълнителна информация)
    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;

    // ====== CONSTRUCTORS ======

    public NotificationEntity() {
        this.createdAt = LocalDateTime.now();
    }

    public NotificationEntity(UserEntity recipient, String type, String message) {
        this();
        this.recipient = recipient;
        this.type = type;
        this.message = message;
    }



    // ====== GETTERS AND SETTERS ======

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public UserEntity getRecipient() {
        return recipient;
    }

    public void setRecipient(UserEntity recipient) {
        this.recipient = recipient;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getActorUsername() {
        return actorUsername;
    }

    public void setActorUsername(String actorUsername) {
        this.actorUsername = actorUsername;
    }

    public String getActorImageUrl() {
        return actorImageUrl;
    }

    public void setActorImageUrl(String actorImageUrl) {
        this.actorImageUrl = actorImageUrl;
    }

    public String getEntityType() {
        return entityType;
    }

    public void setEntityType(String entityType) {
        this.entityType = entityType;
    }

    public Long getEntityId() {
        return entityId;
    }

    public void setEntityId(Long entityId) {
        this.entityId = entityId;
    }

    public String getActionUrl() {
        return actionUrl;
    }

    public void setActionUrl(String actionUrl) {
        this.actionUrl = actionUrl;
    }

    public boolean isRead() {
        return isRead;
    }

    public void setRead(boolean read) {
        isRead = read;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getReadAt() {
        return readAt;
    }

    public void setReadAt(LocalDateTime readAt) {
        this.readAt = readAt;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getMetadata() {
        return metadata;
    }

    public void setMetadata(String metadata) {
        this.metadata = metadata;
    }
}