package smolyanVote.smolyanVote.viewsAndDTO;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;

/**
 * DTO клас специално за Activity Wall съобщения
 * Съдържа всички данни за една активност в системата
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ActivityMessageDto {

    /**
     * Уникален ID на активността
     */
    private Long id;

    /**
     * Време на активността
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime timestamp;

    /**
     * ID на потребителя
     */
    private Long userId;

    /**
     * Потребителско име
     */
    private String username;

    /**
     * Типът действие (от ActivityActionEnum)
     */
    private String action;

    /**
     * Тип на entity-то (PUBLICATION, EVENT, REFERENDUM, etc.)
     */
    private String entityType;

    /**
     * ID на entity-то
     */
    private Long entityId;

    /**
     * Детайли за активността
     */
    private String details;

    /**
     * IP адрес на потребителя
     */
    private String ipAddress;

    /**
     * User Agent на браузъра
     */
    private String userAgent;

    /**
     * Категория на активността за UI филтриране
     * Възможни стойности: "create", "interact", "moderate", "auth", "other"
     */
    private String type;

    /**
     * Допълнителна информация за UI (опционално)
     */
    private String displayText;

    /**
     * CSS клас за иконата (опционално)
     */
    private String iconClass;

    /**
     * CSS клас за цвета (опционално)
     */
    private String colorClass;

    // ===== CONSTRUCTORS =====

    public ActivityMessageDto() {
    }

    public ActivityMessageDto(Long id, LocalDateTime timestamp, String username, String action) {
        this.id = id;
        this.timestamp = timestamp;
        this.username = username;
        this.action = action;
    }

    // ===== STATIC FACTORY METHODS =====

    /**
     * Създава ActivityMessageDto от базови данни
     */
    public static ActivityMessageDto create(Long id, LocalDateTime timestamp, String username,
                                            String action, String entityType, Long entityId) {
        ActivityMessageDto dto = new ActivityMessageDto();
        dto.setId(id);
        dto.setTimestamp(timestamp);
        dto.setUsername(username);
        dto.setAction(action);
        dto.setEntityType(entityType);
        dto.setEntityId(entityId);
        dto.setType(determineType(action));
        dto.setDisplayText(generateDisplayText(action, username, entityType));
        dto.setIconClass(generateIconClass(action));
        dto.setColorClass(generateColorClass(action));
        return dto;
    }

    /**
     * Създава пълен ActivityMessageDto
     */
    public static ActivityMessageDto createFull(Long id, LocalDateTime timestamp, Long userId,
                                                String username, String action, String entityType,
                                                Long entityId, String details, String ipAddress, String userAgent) {
        ActivityMessageDto dto = create(id, timestamp, username, action, entityType, entityId);
        dto.setUserId(userId);
        dto.setDetails(details);
        dto.setIpAddress(ipAddress);
        dto.setUserAgent(userAgent);
        return dto;
    }

    // ===== HELPER METHODS =====

    private static String determineType(String action) {
        if (action == null) return "other";

        String actionLower = action.toLowerCase();

        if (actionLower.contains("create")) return "create";
        if (actionLower.contains("like") || actionLower.contains("vote") ||
                actionLower.contains("share") || actionLower.contains("comment")) return "interact";
        if (actionLower.contains("delete") || actionLower.contains("report") ||
                actionLower.contains("admin") || actionLower.contains("moderate")) return "moderate";
        if (actionLower.contains("login") || actionLower.contains("logout") ||
                actionLower.contains("register")) return "auth";

        return "other";
    }

    private static String generateDisplayText(String action, String username, String entityType) {
        if (action == null || username == null) return "";

        // Примери за генериране на readable text
        switch (action.toUpperCase()) {
            case "CREATE_PUBLICATION":
                return username + " създаде публикация";
            case "CREATE_SIMPLE_EVENT":
                return username + " създаде събитие";
            case "CREATE_REFERENDUM":
                return username + " създаде референдум";
            case "LIKE_PUBLICATION":
                return username + " хареса публикация";
            case "VOTE_SIMPLE_EVENT":
                return username + " гласува в събитие";
            case "USER_LOGIN":
                return username + " влезе в системата";
            case "USER_LOGOUT":
                return username + " излезе от системата";
            default:
                return username + " извърши " + action;
        }
    }

    private static String generateIconClass(String action) {
        if (action == null) return "bi-circle";

        String actionLower = action.toLowerCase();

        if (actionLower.contains("create")) return "bi-plus-circle";
        if (actionLower.contains("like")) return "bi-hand-thumbs-up";
        if (actionLower.contains("dislike")) return "bi-hand-thumbs-down";
        if (actionLower.contains("vote")) return "bi-check-circle";
        if (actionLower.contains("share")) return "bi-share";
        if (actionLower.contains("comment")) return "bi-chat";
        if (actionLower.contains("delete")) return "bi-trash";
        if (actionLower.contains("report")) return "bi-flag";
        if (actionLower.contains("login")) return "bi-box-arrow-in-right";
        if (actionLower.contains("logout")) return "bi-box-arrow-right";
        if (actionLower.contains("register")) return "bi-person-plus";
        if (actionLower.contains("edit")) return "bi-pencil";
        if (actionLower.contains("view")) return "bi-eye";

        return "bi-circle";
    }

    private static String generateColorClass(String action) {
        if (action == null) return "text-secondary";

        String type = determineType(action);

        return switch (type) {
            case "create" -> "text-success";
            case "interact" -> "text-primary";
            case "moderate" -> "text-danger";
            case "auth" -> "text-info";
            default -> "text-secondary";
        };
    }

    // ===== UTILITY METHODS =====

    /**
     * Проверява дали активността е от определен тип
     */
    public boolean isType(String type) {
        return this.type != null && this.type.equals(type);
    }

    /**
     * Проверява дали активността е за конкретен entity
     */
    public boolean isForEntity(String entityType, Long entityId) {
        return this.entityType != null && this.entityType.equals(entityType) &&
                this.entityId != null && this.entityId.equals(entityId);
    }

    /**
     * Проверява дали активността е от конкретен потребител
     */
    public boolean isFromUser(String username) {
        return this.username != null && this.username.equals(username);
    }

    /**
     * Проверява дали активността е от конкретен потребител (по ID)
     */
    public boolean isFromUser(Long userId) {
        return this.userId != null && this.userId.equals(userId);
    }

    /**
     * Форматира времето за показване
     */
    public String getFormattedTime() {
        if (timestamp == null) return "";

        LocalDateTime now = LocalDateTime.now();
        long diffMinutes = java.time.Duration.between(timestamp, now).toMinutes();

        if (diffMinutes < 1) return "Сега";
        if (diffMinutes < 60) return diffMinutes + "м";
        if (diffMinutes < 1440) return (diffMinutes / 60) + "ч";

        return timestamp.toLocalDate().toString();
    }

    // ===== GETTERS AND SETTERS =====

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

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getDisplayText() {
        return displayText;
    }

    public void setDisplayText(String displayText) {
        this.displayText = displayText;
    }

    public String getIconClass() {
        return iconClass;
    }

    public void setIconClass(String iconClass) {
        this.iconClass = iconClass;
    }

    public String getColorClass() {
        return colorClass;
    }

    public void setColorClass(String colorClass) {
        this.colorClass = colorClass;
    }

    // ===== UTILITY =====

    @Override
    public String toString() {
        return "ActivityMessageDto{" +
                "id=" + id +
                ", username='" + username + '\'' +
                ", action='" + action + '\'' +
                ", entityType='" + entityType + '\'' +
                ", type='" + type + '\'' +
                ", timestamp=" + timestamp +
                '}';
    }
}