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

    public ActivityMessageDto(Long id, LocalDateTime timestamp, Long userId, String username,
                              String action, String entityType, Long entityId, String details) {
        this.id = id;
        this.timestamp = timestamp;
        this.userId = userId;
        this.username = username;
        this.action = action;
        this.entityType = entityType;
        this.entityId = entityId;
        this.details = details;
        this.type = determineType(action);
        this.displayText = generateDisplayText(action, username, entityType, entityId);
        this.iconClass = generateIconClass(action);
        this.colorClass = generateColorClass(action);
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
        dto.setDisplayText(generateDisplayText(action, username, entityType, entityId));
        dto.setIconClass(generateIconClass(action));
        dto.setColorClass(generateColorClass(action));
        return dto;
    }

    /**
     * Създава пълен ActivityMessageDto
     */
    public static ActivityMessageDto createFull(Long id, LocalDateTime timestamp, Long userId,
                                                String username, String action, String entityType,
                                                Long entityId, String details, String ipAddress,
                                                String userAgent) {
        ActivityMessageDto dto = new ActivityMessageDto();
        dto.setId(id);
        dto.setTimestamp(timestamp);
        dto.setUserId(userId);
        dto.setUsername(username);
        dto.setAction(action);
        dto.setEntityType(entityType);
        dto.setEntityId(entityId);
        dto.setDetails(details);
        dto.setIpAddress(ipAddress);
        dto.setUserAgent(userAgent);
        dto.setType(determineType(action));
        dto.setDisplayText(generateDisplayText(action, username, entityType, entityId));
        dto.setIconClass(generateIconClass(action));
        dto.setColorClass(generateColorClass(action));
        return dto;
    }

    /**
     * Създава ActivityMessageDto за система (без потребител)
     */
    public static ActivityMessageDto createSystem(String action, String details) {
        ActivityMessageDto dto = new ActivityMessageDto();
        dto.setId(0L);
        dto.setTimestamp(LocalDateTime.now());
        dto.setUsername("System");
        dto.setAction(action);
        dto.setDetails(details);
        dto.setType("other");
        dto.setDisplayText("System: " + details);
        dto.setIconClass("bi-gear");
        dto.setColorClass("text-info");
        return dto;
    }

    // ===== UTILITY METHODS =====

    /**
     * Определя типа на активността за UI филтриране
     */
    public static String determineType(String action) {
        if (action == null || action.isEmpty()) {
            return "other";
        }

        String actionLower = action.toLowerCase();

        // Create actions
        if (actionLower.contains("create") || actionLower.contains("publish") ||
                actionLower.contains("submit") || actionLower.contains("add")) {
            return "create";
        }

        // Interaction actions
        if (actionLower.contains("like") || actionLower.contains("dislike") ||
                actionLower.contains("vote") || actionLower.contains("comment") ||
                actionLower.contains("share") || actionLower.contains("follow") ||
                actionLower.contains("bookmark")) {
            return "interact";
        }

        // Moderation actions
        if (actionLower.contains("delete") || actionLower.contains("remove") ||
                actionLower.contains("ban") || actionLower.contains("report") ||
                actionLower.contains("moderate") || actionLower.contains("admin") ||
                actionLower.contains("approve") || actionLower.contains("reject")) {
            return "moderate";
        }

        // Authentication actions
        if (actionLower.contains("login") || actionLower.contains("logout") ||
                actionLower.contains("register") || actionLower.contains("verify") ||
                actionLower.contains("password") || actionLower.contains("profile")) {
            return "auth";
        }

        return "other";
    }

    /**
     * Генерира човешки четим текст за активността
     */
    public static String generateDisplayText(String action, String username, String entityType, Long entityId) {
        StringBuilder text = new StringBuilder();

        // Добавяме потребителското име
        text.append(username != null ? username : "Anonymous");
        text.append(" ");

        // Конвертираме action към български
        if (action != null) {
            String actionText = convertActionToBulgarian(action);
            text.append(actionText);
        }

        // Добавяме entity информация ако има
        if (entityType != null && entityId != null) {
            String entityText = convertEntityTypeToBulgarian(entityType);
            text.append(" ").append(entityText);
            if (entityId > 0) {
                text.append(" #").append(entityId);
            }
        }

        return text.toString();
    }

    /**
     * Генерира Bootstrap Icons клас за иконата
     */
    public static String generateIconClass(String action) {
        if (action == null) return "bi-circle";

        String actionLower = action.toLowerCase();

        // Create icons
        if (actionLower.contains("create") || actionLower.contains("publish") || actionLower.contains("add")) {
            return "bi-plus-circle";
        }

        // Interaction icons
        if (actionLower.contains("like")) return "bi-heart";
        if (actionLower.contains("dislike")) return "bi-heart-break";
        if (actionLower.contains("vote")) return "bi-check-circle";
        if (actionLower.contains("comment")) return "bi-chat";
        if (actionLower.contains("share")) return "bi-share";
        if (actionLower.contains("follow")) return "bi-person-plus";
        if (actionLower.contains("bookmark")) return "bi-bookmark";

        // Auth icons
        if (actionLower.contains("login")) return "bi-box-arrow-in-right";
        if (actionLower.contains("logout")) return "bi-box-arrow-left";
        if (actionLower.contains("register")) return "bi-person-plus";
        if (actionLower.contains("profile")) return "bi-person-gear";

        // Moderation icons
        if (actionLower.contains("delete") || actionLower.contains("remove")) return "bi-trash";
        if (actionLower.contains("ban")) return "bi-person-x";
        if (actionLower.contains("report")) return "bi-flag";
        if (actionLower.contains("admin") || actionLower.contains("moderate")) return "bi-shield";

        // View icons
        if (actionLower.contains("view")) return "bi-eye";
        if (actionLower.contains("search")) return "bi-search";

        return "bi-circle";
    }

    /**
     * Генерира Bootstrap цветов клас
     */
    public static String generateColorClass(String action) {
        if (action == null) return "text-secondary";

        String actionLower = action.toLowerCase();

        // Success/Create actions
        if (actionLower.contains("create") || actionLower.contains("publish") ||
                actionLower.contains("approve") || actionLower.contains("like")) {
            return "text-success";
        }

        // Primary/Interaction actions
        if (actionLower.contains("vote") || actionLower.contains("comment") ||
                actionLower.contains("share") || actionLower.contains("view")) {
            return "text-primary";
        }

        // Danger/Destructive actions
        if (actionLower.contains("delete") || actionLower.contains("remove") ||
                actionLower.contains("ban") || actionLower.contains("report") ||
                actionLower.contains("dislike")) {
            return "text-danger";
        }

        // Info/Auth actions
        if (actionLower.contains("login") || actionLower.contains("register") ||
                actionLower.contains("profile")) {
            return "text-info";
        }

        // Warning actions
        if (actionLower.contains("logout") || actionLower.contains("reject")) {
            return "text-warning";
        }

        // Admin/Moderation actions
        if (actionLower.contains("admin") || actionLower.contains("moderate")) {
            return "text-purple";
        }

        return "text-secondary";
    }

    // ===== HELPER METHODS =====

    private static String convertActionToBulgarian(String action) {
        if (action == null) return "направи нещо";

        return switch (action.toLowerCase()) {
            case "create_publication" -> "създаде публикация";
            case "create_simple_event" -> "създаде събитие";
            case "create_referendum" -> "създаде референдум";
            case "create_multi_poll" -> "създаде анкета";
            case "create_comment" -> "коментира";
            case "like_publication" -> "хареса публикация";
            case "dislike_publication" -> "не хареса публикация";
            case "like_comment" -> "хареса коментар";
            case "dislike_comment" -> "не хареса коментар";
            case "vote_simple_event" -> "гласува в събитие";
            case "vote_referendum" -> "гласува в референдум";
            case "vote_multi_poll" -> "гласува в анкета";
            case "share_publication" -> "сподели публикация";
            case "share_event" -> "сподели събитие";
            case "user_login" -> "влезе в системата";
            case "user_logout" -> "излезе от системата";
            case "user_register" -> "се регистрира";
            case "view_publication" -> "прегледа публикация";
            case "view_event" -> "прегледа събитие";
            case "delete_publication" -> "изтри публикация";
            case "delete_comment" -> "изтри коментар";
            case "report_content" -> "докладва съдържание";
            default -> action.toLowerCase().replace("_", " ");
        };
    }

    private static String convertEntityTypeToBulgarian(String entityType) {
        if (entityType == null) return "";

        return switch (entityType.toLowerCase()) {
            case "publication" -> "публикация";
            case "simple_event" -> "събитие";
            case "referendum" -> "референдум";
            case "multi_poll" -> "анкета";
            case "comment" -> "коментар";
            case "user" -> "потребител";
            default -> entityType.toLowerCase();
        };
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

    @Override
    public String toString() {
        return "ActivityMessageDto{" +
                "id=" + id +
                ", timestamp=" + timestamp +
                ", username='" + username + '\'' +
                ", action='" + action + '\'' +
                ", entityType='" + entityType + '\'' +
                ", entityId=" + entityId +
                '}';
    }
}