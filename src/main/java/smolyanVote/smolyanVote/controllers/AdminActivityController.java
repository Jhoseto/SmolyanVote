package smolyanVote.smolyanVote.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import smolyanVote.smolyanVote.config.websocket.ActivityWebSocketHandler;
import smolyanVote.smolyanVote.models.ActivityLogEntity;
import smolyanVote.smolyanVote.services.interfaces.ActivityLogService;
import smolyanVote.smolyanVote.viewsAndDTO.ActivityMessageDto;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/api/activities")
@PreAuthorize("hasRole('ADMIN')")
public class AdminActivityController {

    private final ActivityLogService activityLogService;
    private final ActivityWebSocketHandler activityWebSocketHandler;

    @Autowired
    public AdminActivityController(ActivityLogService activityLogService,
                                   ActivityWebSocketHandler activityWebSocketHandler) {
        this.activityLogService = activityLogService;
        this.activityWebSocketHandler = activityWebSocketHandler;
    }

    // ===== RECENT ACTIVITIES =====

    /**
     * Връща последните активности за Activity Wall
     */
    @GetMapping("/recent")
    public ResponseEntity<Map<String, Object>> getRecentActivities(
            @RequestParam(defaultValue = "50") int limit) {

        try {
            // Валидираме limit
            limit = Math.min(Math.max(1, limit), 500);

            List<ActivityLogEntity> activities = activityLogService.getRecentActivities(limit);
            Map<String, Object> stats = activityLogService.getActivityStatistics();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("activities", convertActivitiesToJson(activities));
            response.put("stats", stats);
            response.put("timestamp", LocalDateTime.now());
            response.put("count", activities.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ Error loading recent activities: " + e.getMessage());
            return ResponseEntity.status(500).body(createErrorResponse("Грешка при зареждането на активностите: " + e.getMessage()));
        }
    }

    /**
     * Връща нови активности след определено ID (за real-time updates)
     */
    @GetMapping("/since/{lastId}")
    public ResponseEntity<Map<String, Object>> getActivitiesSinceId(@PathVariable Long lastId) {

        try {
            List<ActivityLogEntity> activities = activityLogService.getActivitiesSinceId(lastId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("activities", convertActivitiesToJson(activities));
            response.put("timestamp", LocalDateTime.now());
            response.put("count", activities.size());
            response.put("lastId", lastId);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ Error loading activities since ID: " + e.getMessage());
            return ResponseEntity.status(500).body(createErrorResponse("Грешка при зареждането на новите активности: " + e.getMessage()));
        }
    }

    // ===== FILTERED ACTIVITIES =====

    /**
     * Връща активности с филтриране и пагинация
     */
    @GetMapping("/filtered")
    public ResponseEntity<Map<String, Object>> getFilteredActivities(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime since,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "timestamp") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        try {
            // Валидираме параметри
            size = Math.min(Math.max(1, size), 100);
            page = Math.max(0, page);

            // Създаваме Pageable
            Sort.Direction direction = sortDir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

            // Търсим с филтри
            Page<ActivityLogEntity> activitiesPage = activityLogService.getActivitiesWithFilters(
                    action, username, entityType, since, pageable);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("activities", convertActivitiesToJson(activitiesPage.getContent()));
            response.put("totalElements", activitiesPage.getTotalElements());
            response.put("totalPages", activitiesPage.getTotalPages());
            response.put("currentPage", page);
            response.put("size", size);
            response.put("hasNext", activitiesPage.hasNext());
            response.put("hasPrevious", activitiesPage.hasPrevious());
            response.put("timestamp", LocalDateTime.now());

            // Добавяме filter info
            Map<String, Object> filters = new HashMap<>();
            filters.put("action", action);
            filters.put("username", username);
            filters.put("entityType", entityType);
            filters.put("since", since);
            response.put("appliedFilters", filters);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ Error filtering activities: " + e.getMessage());
            return ResponseEntity.status(500).body(createErrorResponse("Грешка при филтрирането на активностите: " + e.getMessage()));
        }
    }

    // ===== STATISTICS =====

    /**
     * Връща статистики за активностите
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getActivityStatistics() {

        try {
            Map<String, Object> stats = activityLogService.getActivityStatistics();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("stats", stats);
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ Error loading statistics: " + e.getMessage());
            return ResponseEntity.status(500).body(createErrorResponse("Грешка при зареждането на статистиките: " + e.getMessage()));
        }
    }

    /**
     * Връща top потребители за период
     */
    @GetMapping("/stats/top-users")
    public ResponseEntity<Map<String, Object>> getTopUsers(
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(defaultValue = "24") int hours) {

        try {
            limit = Math.min(Math.max(1, limit), 50);
            hours = Math.min(Math.max(1, hours), 720); // max 30 дни

            LocalDateTime since = LocalDateTime.now().minusHours(hours);
            List<Map<String, Object>> topUsers = activityLogService.getTopUsers(limit, since);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("topUsers", topUsers);
            response.put("period", hours + " hours");
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ Error loading top users: " + e.getMessage());
            return ResponseEntity.status(500).body(createErrorResponse("Грешка при зареждането на top потребителите: " + e.getMessage()));
        }
    }

    /**
     * Връща top действия за период
     */
    @GetMapping("/stats/top-actions")
    public ResponseEntity<Map<String, Object>> getTopActions(
            @RequestParam(defaultValue = "24") int hours) {

        try {
            hours = Math.min(Math.max(1, hours), 720); // max 30 дни

            LocalDateTime since = LocalDateTime.now().minusHours(hours);
            List<Map<String, Object>> topActions = activityLogService.getTopActions(since);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("topActions", topActions);
            response.put("period", hours + " hours");
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ Error loading top actions: " + e.getMessage());
            return ResponseEntity.status(500).body(createErrorResponse("Грешка при зареждането на top действията: " + e.getMessage()));
        }
    }

    // ===== ENTITY ACTIVITIES =====

    /**
     * Връща активности за конкретен entity
     */
    @GetMapping("/entity/{entityType}/{entityId}")
    public ResponseEntity<Map<String, Object>> getActivitiesForEntity(
            @PathVariable String entityType,
            @PathVariable Long entityId) {

        try {
            List<ActivityLogEntity> activities = activityLogService.getActivitiesForEntity(entityType, entityId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("activities", convertActivitiesToJson(activities));
            response.put("entityType", entityType);
            response.put("entityId", entityId);
            response.put("count", activities.size());
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ Error loading entity activities: " + e.getMessage());
            return ResponseEntity.status(500).body(createErrorResponse("Грешка при зареждането на активностите за entity: " + e.getMessage()));
        }
    }

    // ===== IP TRACKING =====

    /**
     * Връща активности от конкретен IP адрес
     */
    @GetMapping("/ip/{ipAddress}")
    public ResponseEntity<Map<String, Object>> getActivitiesFromIp(@PathVariable String ipAddress) {

        try {
            List<ActivityLogEntity> activities = activityLogService.getActivitiesFromIp(ipAddress);
            boolean isSuspicious = activityLogService.isSuspiciousIp(ipAddress);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("activities", convertActivitiesToJson(activities));
            response.put("ipAddress", ipAddress);
            response.put("count", activities.size());
            response.put("isSuspicious", isSuspicious);
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ Error loading IP activities: " + e.getMessage());
            return ResponseEntity.status(500).body(createErrorResponse("Грешка при зареждането на активностите от IP: " + e.getMessage()));
        }
    }

    /**
     * Връща IP адресите на потребител
     */
    @GetMapping("/user/{userId}/ips")
    public ResponseEntity<Map<String, Object>> getUserIpAddresses(@PathVariable Long userId) {

        try {
            List<String> ipAddresses = activityLogService.getUserIpAddresses(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("ipAddresses", ipAddresses);
            response.put("userId", userId);
            response.put("count", ipAddresses.size());
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ Error loading user IPs: " + e.getMessage());
            return ResponseEntity.status(500).body(createErrorResponse("Грешка при зареждането на IP адресите: " + e.getMessage()));
        }
    }

    // ===== WEBSOCKET INFO =====

    /**
     * Връща информация за WebSocket връзките
     */
    @GetMapping("/websocket/info")
    public ResponseEntity<Map<String, Object>> getWebSocketInfo() {

        try {
            Map<String, Object> connectionInfo = activityWebSocketHandler.getConnectionInfo();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("websocket", connectionInfo);
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ Error loading WebSocket info: " + e.getMessage());
            return ResponseEntity.status(500).body(createErrorResponse("Грешка при зареждането на WebSocket информацията: " + e.getMessage()));
        }
    }

    // ===== EXPORT =====

    /**
     * Експортира активности като CSV
     */
    @GetMapping("/export")
    public ResponseEntity<String> exportActivities(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime since,
            @RequestParam(defaultValue = "1000") int limit) {

        try {
            // Ограничаваме експорта
            limit = Math.min(Math.max(1, limit), 10000);

            // Зареждаме данни
            Pageable pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "timestamp"));
            Page<ActivityLogEntity> activitiesPage = activityLogService.getActivitiesWithFilters(
                    action, username, entityType, since, pageable);

            // Генерираме CSV
            StringBuilder csv = new StringBuilder();
            csv.append("ID,Timestamp,Username,Action,EntityType,EntityID,Details,IPAddress\n");

            for (ActivityLogEntity activity : activitiesPage.getContent()) {
                csv.append(escapeCSV(activity.getId()))
                        .append(",").append(escapeCSV(activity.getTimestamp().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)))
                        .append(",").append(escapeCSV(activity.getUsername()))
                        .append(",").append(escapeCSV(activity.getAction()))
                        .append(",").append(escapeCSV(activity.getEntityType()))
                        .append(",").append(escapeCSV(activity.getEntityId()))
                        .append(",").append(escapeCSV(activity.getDetails()))
                        .append(",").append(escapeCSV(activity.getIpAddress()))
                        .append("\n");
            }

            // Генерираме filename
            String filename = "activity_log_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss")) + ".csv";

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType("text/csv"))
                    .body(csv.toString());

        } catch (Exception e) {
            System.err.println("❌ Error exporting activities: " + e.getMessage());
            return ResponseEntity.status(500).body("Грешка при експортирането: " + e.getMessage());
        }
    }

    // ===== CLEANUP =====

    /**
     * Стартира ръчно изчистване на стари записи
     */
    @PostMapping("/cleanup")
    public ResponseEntity<Map<String, Object>> triggerCleanup(
            @RequestParam(defaultValue = "30") int retentionDays) {

        try {
            retentionDays = Math.min(Math.max(1, retentionDays), 365); // max 1 година

            activityLogService.cleanupOldActivities(retentionDays);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Изчистването е стартирано");
            response.put("retentionDays", retentionDays);
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("❌ Error triggering cleanup: " + e.getMessage());
            return ResponseEntity.status(500).body(createErrorResponse("Грешка при стартирането на изчистването: " + e.getMessage()));
        }
    }

    // ===== HELPER METHODS =====

    /**
     * Конвертира ActivityLogEntity към JSON-friendly format
     */
    private List<Map<String, Object>> convertActivitiesToJson(List<ActivityLogEntity> activities) {
        return activities.stream().map(activity -> {
            ActivityMessageDto dto = ActivityMessageDto.createFull(
                    activity.getId(),
                    activity.getTimestamp(),
                    activity.getUserId(),
                    activity.getUsername(),
                    activity.getAction(),
                    activity.getEntityType(),
                    activity.getEntityId(),
                    activity.getDetails(),
                    activity.getIpAddress(),
                    activity.getUserAgent()
            );

            Map<String, Object> map = new HashMap<>();
            map.put("id", dto.getId());
            map.put("timestamp", dto.getTimestamp());
            map.put("userId", dto.getUserId());
            map.put("username", dto.getUsername());
            map.put("action", dto.getAction());
            map.put("entityType", dto.getEntityType());
            map.put("entityId", dto.getEntityId());
            map.put("details", dto.getDetails());
            map.put("ipAddress", dto.getIpAddress());
            map.put("type", dto.getType());
            map.put("displayText", dto.getDisplayText());
            map.put("iconClass", dto.getIconClass());
            map.put("colorClass", dto.getColorClass());

            return map;
        }).collect(Collectors.toList());
    }

    /**
     * Създава error response
     */
    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> error = new HashMap<>();
        error.put("success", false);
        error.put("error", message);
        error.put("timestamp", LocalDateTime.now());
        return error;
    }

    /**
     * Escape CSV стойности
     */
    private String escapeCSV(Object value) {
        if (value == null) return "";
        String str = value.toString();
        if (str.contains(",") || str.contains("\"") || str.contains("\n")) {
            return "\"" + str.replace("\"", "\"\"") + "\"";
        }
        return str;
    }
}