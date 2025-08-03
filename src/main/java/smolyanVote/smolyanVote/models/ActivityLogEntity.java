package smolyanVote.smolyanVote.models;

import jakarta.persistence.*;
import smolyanVote.smolyanVote.models.enums.ActivityActionEnum;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Entity за записване на всички потребителски активности в системата
 * Използва се за admin monitoring и audit trail
 */
@Entity
@Table(name = "activity_logs", indexes = {
        @Index(name = "idx_activity_timestamp", columnList = "timestamp"),
        @Index(name = "idx_activity_user_id", columnList = "user_id"),
        @Index(name = "idx_activity_action", columnList = "action"),
        @Index(name = "idx_activity_entity", columnList = "entity_type, entity_id"),
        @Index(name = "idx_activity_ip", columnList = "ip_address")
})
public class ActivityLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "timestamp", nullable = false, columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime timestamp;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "username", length = 100)
    private String username;

    @Column(name = "action", length = 50, nullable = false)
    private String action;

    @Column(name = "entity_type", length = 30)
    private String entityType;

    @Column(name = "entity_id")
    private Long entityId;

    @Column(name = "details", columnDefinition = "TEXT")
    private String details;

    @Column(name = "ip_address", length = 45) // IPv6 support
    private String ipAddress;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @Column(name = "created_at", nullable = false, columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt;

    // ====== CONSTRUCTORS ======

    public ActivityLogEntity() {
        this.timestamp = LocalDateTime.now();
        this.createdAt = LocalDateTime.now();
    }

    public ActivityLogEntity(String action, Long userId, String username, String ipAddress) {
        this();
        this.action = action;
        this.userId = userId;
        this.username = username;
        this.ipAddress = ipAddress;
    }

    public ActivityLogEntity(String action, Long userId, String username, String entityType,
                             Long entityId, String details, String ipAddress, String userAgent) {
        this();
        this.action = action;
        this.userId = userId;
        this.username = username;
        this.entityType = entityType;
        this.entityId = entityId;
        this.details = details;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
    }

    public ActivityLogEntity(ActivityActionEnum actionEnum, Long userId, String username, String entityType,
                             Long entityId, String details, String ipAddress, String userAgent) {
        this(actionEnum.getActionName(), userId, username, entityType, entityId, details, ipAddress, userAgent);
    }

    // ====== LIFECYCLE CALLBACKS ======

    @PrePersist
    protected void onCreate() {
        if (this.timestamp == null) {
            this.timestamp = LocalDateTime.now();
        }
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    // ====== BUSINESS METHODS ======

    /**
     * Проверява дали активността е от определен тип
     */
    public boolean isActionType(String actionType) {
        return this.action != null && this.action.equalsIgnoreCase(actionType);
    }

    /**
     * Проверява дали активността е от ActivityActionEnum
     */
    public boolean isActionEnum(ActivityActionEnum actionEnum) {
        return this.action != null && this.action.equals(actionEnum.getActionName());
    }

    /**
     * Проверява дали активността е за определен entity
     */
    public boolean isForEntity(String entityType, Long entityId) {
        return Objects.equals(this.entityType, entityType) && Objects.equals(this.entityId, entityId);
    }

    /**
     * Проверява дали активността е от определен потребител
     */
    public boolean isFromUser(Long userId) {
        return Objects.equals(this.userId, userId);
    }

    /**
     * Проверява дали активността е от определен username
     */
    public boolean isFromUsername(String username) {
        return Objects.equals(this.username, username);
    }

    /**
     * Проверява дали активността е от определен IP
     */
    public boolean isFromIp(String ipAddress) {
        return Objects.equals(this.ipAddress, ipAddress);
    }

    /**
     * Проверява дали активността е нова (в последните N минути)
     */
    public boolean isRecent(int minutes) {
        if (this.timestamp == null) return false;
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(minutes);
        return this.timestamp.isAfter(cutoff);
    }

    /**
     * Връща категорията на активността за UI филтриране
     */
    public String getActivityCategory() {
        if (this.action == null) return "other";

        String actionLower = this.action.toLowerCase();

        if (actionLower.contains("create")) return "create";
        if (actionLower.contains("like") || actionLower.contains("vote") ||
                actionLower.contains("share") || actionLower.contains("comment")) return "interact";
        if (actionLower.contains("delete") || actionLower.contains("report") ||
                actionLower.contains("admin") || actionLower.contains("moderate")) return "moderate";
        if (actionLower.contains("login") || actionLower.contains("logout") ||
                actionLower.contains("register")) return "auth";

        return "other";
    }

    /**
     * Връща дисплей текст за активността
     */
    public String getDisplayText() {
        StringBuilder display = new StringBuilder();

        display.append(this.username != null ? this.username : "Anonymous");
        display.append(" ");

        if (this.action != null) {
            // Конвертираме action към четим текст
            String actionText = this.action.toLowerCase().replace("_", " ");
            display.append(actionText);
        }

        if (this.entityType != null && this.entityId != null) {
            display.append(" (").append(this.entityType).append(" #").append(this.entityId).append(")");
        }

        return display.toString();
    }

    /**
     * Връща кратка версия на детайлите (за списъци)
     */
    public String getShortDetails() {
        if (this.details == null || this.details.isEmpty()) {
            return null;
        }

        if (this.details.length() <= 100) {
            return this.details;
        }

        return this.details.substring(0, 97) + "...";
    }

    /**
     * Проверява дали има детайли
     */
    public boolean hasDetails() {
        return this.details != null && !this.details.trim().isEmpty();
    }

    /**
     * Проверява дали има entity информация
     */
    public boolean hasEntityInfo() {
        return this.entityType != null && this.entityId != null;
    }

    /**
     * Проверява дали е от автентифициран потребител
     */
    public boolean isFromAuthenticatedUser() {
        return this.userId != null && this.username != null && !this.username.equals("Anonymous");
    }

    // ====== GETTERS AND SETTERS ======

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
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

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    // ====== OBJECT METHODS ======

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;

        ActivityLogEntity that = (ActivityLogEntity) obj;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "ActivityLogEntity{" +
                "id=" + id +
                ", timestamp=" + timestamp +
                ", username='" + username + '\'' +
                ", action='" + action + '\'' +
                ", entityType='" + entityType + '\'' +
                ", entityId=" + entityId +
                ", ipAddress='" + ipAddress + '\'' +
                '}';
    }

    /**
     * Детайлна версия на toString за debugging
     */
    public String toDetailedString() {
        return "ActivityLogEntity{" +
                "id=" + id +
                ", timestamp=" + timestamp +
                ", userId=" + userId +
                ", username='" + username + '\'' +
                ", action='" + action + '\'' +
                ", entityType='" + entityType + '\'' +
                ", entityId=" + entityId +
                ", details='" + (hasDetails() ? getShortDetails() : "none") + '\'' +
                ", ipAddress='" + ipAddress + '\'' +
                ", userAgent='" + (userAgent != null ? (userAgent.length() > 50 ? userAgent.substring(0, 47) + "..." : userAgent) : "none") + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }
}