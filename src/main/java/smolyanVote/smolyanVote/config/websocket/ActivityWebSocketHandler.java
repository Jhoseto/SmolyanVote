package smolyanVote.smolyanVote.config.websocket;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;
import smolyanVote.smolyanVote.models.ActivityLogEntity;
import smolyanVote.smolyanVote.services.interfaces.ActivityLogService;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.viewsAndDTO.ActivityMessageDto;
import smolyanVote.smolyanVote.viewsAndDTO.WebSocketMessageDto;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * WebSocket Handler за real-time Activity Wall updates
 * Управлява връзките на админите и изпраща нови активности в реално време
 */
@Component
public class ActivityWebSocketHandler extends BaseWebSocketHandler {

    private final ActivityLogService activityLogService;

    @Autowired
    public ActivityWebSocketHandler(UserService userService,
                                    ActivityLogService activityLogService) {
        super(userService);
        this.activityLogService = activityLogService;
    }

    // ===== ABSTRACT METHODS IMPLEMENTATION =====

    @Override
    protected boolean hasPermission(WebSocketSession session) {
        System.out.println("🔍 WebSocket permission check triggered!");
        System.out.println("🔍 Session ID: " + session.getId());
        System.out.println("🔍 Session URI: " + session.getUri());

        return isAdminUser();
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, String message) {
        try {
            // Парсираме съобщението от клиента
            WebSocketMessageDto clientMessage = objectMapper.readValue(message, WebSocketMessageDto.class);

            switch (clientMessage.getType()) {
                case "ping":
                    handlePingMessage(session);
                    break;

                case "get_recent":
                    handleGetRecentActivities(session, clientMessage);
                    break;

                case "get_stats":
                    handleGetStatistics(session);
                    break;

                case "get_since":
                    handleGetActivitiesSince(session, clientMessage);
                    break;

                default:
                    sendErrorMessage(session, "Unknown message type: " + clientMessage.getType());
            }

        } catch (Exception e) {
            System.err.println("❌ Error parsing Activity Wall message: " + e.getMessage());
            sendErrorMessage(session, "Invalid message format");
        }
    }

    @Override
    protected String getHandlerName() {
        return "Activity Wall";
    }

    // ===== CLIENT MESSAGE HANDLERS =====

    private void handlePingMessage(WebSocketSession session) {
        WebSocketMessageDto pong = new WebSocketMessageDto();
        pong.setType("pong");
        pong.setData("Server time: " + LocalDateTime.now());
        pong.setTimestamp(LocalDateTime.now());
        sendMessage(session, pong);
    }

    private void handleGetRecentActivities(WebSocketSession session, WebSocketMessageDto clientMessage) {
        try {
            // Извличаме limit от клиентското съобщение
            int limit = 50; // default
            if (clientMessage.getData() instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> data = (Map<String, Object>) clientMessage.getData();
                Object limitObj = data.get("limit");
                if (limitObj instanceof Number) {
                    limit = Math.min(((Number) limitObj).intValue(), 200); // max 200
                }
            }

            // Зареждаме последните активности
            List<ActivityLogEntity> activities = activityLogService.getRecentActivities(limit);

            // Конвертираме към DTO формат
            List<Map<String, Object>> activitiesData = activities.stream()
                    .map(this::convertActivityToMap)
                    .toList();

            // Изпращаме отговор
            WebSocketMessageDto response = new WebSocketMessageDto();
            response.setType("recent_activities");
            response.setData(activitiesData);
            response.setTimestamp(LocalDateTime.now());

            sendMessage(session, response);

        } catch (Exception e) {
            System.err.println("❌ Error getting recent activities: " + e.getMessage());
            sendErrorMessage(session, "Failed to load recent activities");
        }
    }

    private void handleGetActivitiesSince(WebSocketSession session, WebSocketMessageDto clientMessage) {
        try {
            Long lastId = null;
            if (clientMessage.getData() instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> data = (Map<String, Object>) clientMessage.getData();
                Object lastIdObj = data.get("lastId");
                if (lastIdObj instanceof Number) {
                    lastId = ((Number) lastIdObj).longValue();
                }
            }

            // Зареждаме нови активности
            List<ActivityLogEntity> activities = activityLogService.getActivitiesSinceId(lastId);

            // Конвертираме към DTO формат
            List<Map<String, Object>> activitiesData = activities.stream()
                    .map(this::convertActivityToMap)
                    .toList();

            // Изпращаме отговор
            WebSocketMessageDto response = new WebSocketMessageDto();
            response.setType("activities_since");
            response.setData(activitiesData);
            response.setTimestamp(LocalDateTime.now());

            sendMessage(session, response);

        } catch (Exception e) {
            System.err.println("❌ Error getting activities since ID: " + e.getMessage());
            sendErrorMessage(session, "Failed to load new activities");
        }
    }

    private void handleGetStatistics(WebSocketSession session) {
        try {
            Map<String, Object> stats = activityLogService.getActivityStatistics();

            WebSocketMessageDto response = new WebSocketMessageDto();
            response.setType("statistics");
            response.setData(stats);
            response.setTimestamp(LocalDateTime.now());

            sendMessage(session, response);

        } catch (Exception e) {
            System.err.println("❌ Error getting activity statistics: " + e.getMessage());
            sendErrorMessage(session, "Failed to load statistics");
        }
    }

    // ===== PUBLIC METHODS FOR BROADCASTING =====

    /**
     * Изпраща нова активност към всички свързани админи
     * Този метод се извиква от ActivityLogService при нова активност
     */
    public void broadcastNewActivity(ActivityLogEntity activity) {
        if (getActiveSessionsCount() == 0) {
            return; // Няма свързани админи
        }

        try {
            ActivityMessageDto activityDto = convertActivityToDto(activity);

            WebSocketMessageDto message = new WebSocketMessageDto();
            message.setType("new_activity");
            message.setData(activityDto);
            message.setTimestamp(LocalDateTime.now());

            broadcastMessage(message);

            System.out.println("📡 Broadcasted new activity to " + getActiveSessionsCount() + " admin(s): " +
                    activity.getAction() + " by " + activity.getUsername());

        } catch (Exception e) {
            System.err.println("❌ Error broadcasting new activity: " + e.getMessage());
        }
    }

    /**
     * Изпраща обновени статистики към всички свързани админи
     */
    public void broadcastStatsUpdate() {
        if (getActiveSessionsCount() == 0) {
            return;
        }

        try {
            Map<String, Object> stats = activityLogService.getActivityStatistics();

            WebSocketMessageDto message = new WebSocketMessageDto();
            message.setType("stats_update");
            message.setData(stats);
            message.setTimestamp(LocalDateTime.now());

            broadcastMessage(message);

        } catch (Exception e) {
            System.err.println("❌ Error broadcasting stats update: " + e.getMessage());
        }
    }

    /**
     * Изпраща съобщение към всички админи (за system announcements)
     */
    public void broadcastSystemMessage(String messageText, String level) {
        if (getActiveSessionsCount() == 0) {
            return;
        }

        Map<String, Object> systemData = new HashMap<>();
        systemData.put("message", messageText);
        systemData.put("level", level); // info, warning, error

        WebSocketMessageDto message = new WebSocketMessageDto();
        message.setType("system_message");
        message.setData(systemData);
        message.setTimestamp(LocalDateTime.now());

        broadcastMessage(message);

        System.out.println("📢 Broadcasted system message (" + level + "): " + messageText);
    }

    // ===== CONVERSION HELPERS =====

    private ActivityMessageDto convertActivityToDto(ActivityLogEntity activity) {
        ActivityMessageDto dto = new ActivityMessageDto();
        dto.setId(activity.getId());
        dto.setTimestamp(activity.getTimestamp());
        dto.setUserId(activity.getUserId());
        dto.setUsername(activity.getUsername());
        dto.setAction(activity.getAction());
        dto.setEntityType(activity.getEntityType());
        dto.setEntityId(activity.getEntityId());
        dto.setDetails(activity.getDetails());
        dto.setIpAddress(activity.getIpAddress());
        dto.setUserAgent(activity.getUserAgent());

        // Добавяме тип за frontend филтрирането
        dto.setType(determineActivityType(activity.getAction()));
        dto.setDisplayText(generateDisplayText(activity));
        dto.setIconClass(generateIconClass(activity.getAction()));
        dto.setColorClass(generateColorClass(activity.getAction()));

        return dto;
    }

    private Map<String, Object> convertActivityToMap(ActivityLogEntity activity) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", activity.getId());
        map.put("timestamp", activity.getTimestamp().toString());
        map.put("userId", activity.getUserId());
        map.put("username", activity.getUsername());
        map.put("action", activity.getAction());
        map.put("entityType", activity.getEntityType());
        map.put("entityId", activity.getEntityId());
        map.put("details", activity.getDetails());
        map.put("ipAddress", activity.getIpAddress());
        map.put("userAgent", activity.getUserAgent());
        map.put("type", determineActivityType(activity.getAction()));
        map.put("displayText", generateDisplayText(activity));
        map.put("iconClass", generateIconClass(activity.getAction()));
        map.put("colorClass", generateColorClass(activity.getAction()));
        return map;
    }

    private String determineActivityType(String action) {
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

    private String generateDisplayText(ActivityLogEntity activity) {
        StringBuilder text = new StringBuilder();
        text.append(activity.getUsername() != null ? activity.getUsername() : "Anonymous");
        text.append(" ");

        // Конвертираме action към човешки четим текст
        String action = activity.getAction();
        if (action != null) {
            switch (action.toLowerCase()) {
                case "create_publication" -> text.append("създаде публикация");
                case "create_simple_event" -> text.append("създаде събитие");
                case "create_referendum" -> text.append("създаде референдум");
                case "like_publication" -> text.append("хареса публикация");
                case "vote_simple_event" -> text.append("гласува в събитие");
                case "user_login" -> text.append("влезе в системата");
                case "user_logout" -> text.append("излезе от системата");
                default -> text.append(action.toLowerCase().replace("_", " "));
            }
        }

        if (activity.getEntityType() != null && activity.getEntityId() != null) {
            text.append(" (").append(activity.getEntityType()).append(" #").append(activity.getEntityId()).append(")");
        }

        return text.toString();
    }

    private String generateIconClass(String action) {
        if (action == null) return "bi-circle";

        String actionLower = action.toLowerCase();

        if (actionLower.contains("create")) return "bi-plus-circle";
        if (actionLower.contains("like")) return "bi-heart";
        if (actionLower.contains("vote")) return "bi-check-circle";
        if (actionLower.contains("comment")) return "bi-chat";
        if (actionLower.contains("share")) return "bi-share";
        if (actionLower.contains("login")) return "bi-box-arrow-in-right";
        if (actionLower.contains("logout")) return "bi-box-arrow-left";
        if (actionLower.contains("delete")) return "bi-trash";
        if (actionLower.contains("report")) return "bi-flag";
        if (actionLower.contains("admin")) return "bi-shield";

        return "bi-circle";
    }

    private String generateColorClass(String action) {
        if (action == null) return "text-secondary";

        String actionLower = action.toLowerCase();

        if (actionLower.contains("create")) return "text-success";
        if (actionLower.contains("like") || actionLower.contains("vote") || actionLower.contains("share")) return "text-primary";
        if (actionLower.contains("delete") || actionLower.contains("report")) return "text-danger";
        if (actionLower.contains("login") || actionLower.contains("logout")) return "text-info";
        if (actionLower.contains("admin") || actionLower.contains("moderate")) return "text-warning";

        return "text-secondary";
    }
}