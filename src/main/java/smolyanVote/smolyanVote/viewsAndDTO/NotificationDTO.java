package smolyanVote.smolyanVote.viewsAndDTO;

import smolyanVote.smolyanVote.models.NotificationEntity;

import java.time.Duration;
import java.time.LocalDateTime;

/**
 * Универсално DTO с вграден mapper
 * Една точка на истина за всички нотификации
 */
public class NotificationDTO {

    private Long id;
    private String type;
    private String title;
    private String message;
    private String actorUsername;
    private String actorImageUrl;
    private String entityType;
    private Long entityId;
    private String actionUrl;
    private boolean isRead;
    private LocalDateTime createdAt;
    private String priority;
    private String icon;
    private String timeAgo;
    private String displayName;

    // ====== CONSTRUCTOR ======

    public NotificationDTO() {}

    // ====== STATIC MAPPER (единственото място за mapping) ======

    /**
     * Entity -> DTO (с всички изчисления)
     */
    public static NotificationDTO fromEntity(NotificationEntity entity) {
        if (entity == null) return null;

        NotificationDTO dto = new NotificationDTO();
        dto.id = entity.getId();
        dto.type = entity.getType();
        dto.title = entity.getTitle();
        dto.message = entity.getMessage();
        dto.actorUsername = entity.getActorUsername();
        // actorImageUrl се допълва от NotificationServiceImpl от UserEntity
        dto.actorImageUrl = null;
        dto.entityType = entity.getEntityType();
        dto.entityId = entity.getEntityId();
        dto.actionUrl = entity.getActionUrl();
        dto.isRead = entity.isRead();
        dto.createdAt = entity.getCreatedAt();
        dto.priority = entity.getPriority();

        // Изчислими полета (бизнес логика в DTO mapper-а)
        dto.icon = getIconForType(entity.getType());
        dto.displayName = getDisplayNameForType(entity.getType());
        dto.timeAgo = formatTimeAgo(entity.getCreatedAt());

        return dto;
    }

    // ====== HELPER METHODS (статични, без състояние) ======

    private static String getIconForType(String type) {
        return switch (type) {
            case "COMMENT", "REPLY" -> "bi-chat-left-text";
            case "LIKE" -> "bi-heart-fill";
            case "DISLIKE" -> "bi-heartbreak-fill";
            case "MENTION" -> "bi-at";
            case "EVENT_ENDED", "VOTE_COUNTED" -> "bi-check-circle";
            case "PUBLICATION_APPROVED" -> "bi-check-circle-fill";
            case "SIGNAL_REVIEWED" -> "bi-flag-fill";
            case "NEW_FOLLOWER" -> "bi-person-plus";
            case "UNFOLLOW" -> "bi-person-dash";
            case "NEW_VOTE" -> "bi-hand-thumbs-up";
            case "ROLE_CHANGED" -> "bi-shield-check";
            default -> "bi-bell";
        };
    }

    private static String getDisplayNameForType(String type) {
        return switch (type) {
            case "COMMENT" -> "Коментар";
            case "REPLY" -> "Отговор";
            case "LIKE" -> "Харесване";
            case "DISLIKE" -> "Нехаресване";
            case "MENTION" -> "Споменаване";
            case "EVENT_ENDED" -> "Събитие приключило";
            case "VOTE_COUNTED" -> "Гласуване отчетено";
            case "PUBLICATION_APPROVED" -> "Публикация одобрена";
            case "SIGNAL_REVIEWED" -> "Сигнал разгледан";
            case "NEW_FOLLOWER" -> "Нов последовател";
            case "UNFOLLOW" -> "Спря да следва";
            case "NEW_VOTE" -> "Ново гласуване";
            case "ROLE_CHANGED" -> "Промяна на роля";
            default -> "Известие";
        };
    }

    private static String formatTimeAgo(LocalDateTime dateTime) {
        if (dateTime == null) return "";

        Duration duration = Duration.between(dateTime, LocalDateTime.now());
        long seconds = duration.getSeconds();

        if (seconds < 60) return "Сега";
        if (seconds < 3600) return (seconds / 60) + " мин";
        if (seconds < 86400) return (seconds / 3600) + " ч";
        if (seconds < 604800) return (seconds / 86400) + " д";
        return (seconds / 604800) + " седм";
    }

    // ====== GETTERS ======

    public Long getId() { return id; }
    public String getType() { return type; }
    public String getTitle() { return title; }
    public String getMessage() { return message; }
    public String getActorUsername() { return actorUsername; }
    public String getActorImageUrl() { return actorImageUrl; }
    public String getEntityType() { return entityType; }
    public Long getEntityId() { return entityId; }
    public String getActionUrl() { return actionUrl; }
    public boolean isRead() { return isRead; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getPriority() { return priority; }
    public String getIcon() { return icon; }
    public String getTimeAgo() { return timeAgo; }
    public String getDisplayName() { return displayName; }
    
    // ====== SETTER (само за actorImageUrl - допълва се от service) ======
    
    public void setActorImageUrl(String actorImageUrl) {
        this.actorImageUrl = actorImageUrl;
    }
}