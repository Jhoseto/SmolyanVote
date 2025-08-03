package smolyanVote.smolyanVote.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import smolyanVote.smolyanVote.models.ActivityLogEntity;
import smolyanVote.smolyanVote.services.interfaces.ActivityLogService;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/api/activities")
@PreAuthorize("hasRole('ADMIN')")
public class AdminActivityController {

    private final ActivityLogService activityLogService;

    @Autowired
    public AdminActivityController(ActivityLogService activityLogService) {
        this.activityLogService = activityLogService;
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

            return ResponseEntity.ok(response);

        } catch (Exception e) {
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
            response.put("count", activities.size());
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Грешка при зареждането на нови активности: " + e.getMessage()));
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
            @RequestParam(required = false) String since,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        try {
            // Валидираме параметрите
            page = Math.max(0, page);
            size = Math.min(Math.max(1, size), 200);

            LocalDateTime sinceDate = null;
            if (since != null && !since.trim().isEmpty()) {
                try {
                    sinceDate = LocalDateTime.parse(since);
                } catch (Exception e) {
                    return ResponseEntity.badRequest().body(createErrorResponse("Невалиден формат на датата"));
                }
            }

            Pageable pageable = PageRequest.of(page, size);
            Page<ActivityLogEntity> activitiesPage = activityLogService.getActivitiesWithFilters(
                    action, username, entityType, sinceDate, pageable);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("activities", convertActivitiesToJson(activitiesPage.getContent()));
            response.put("totalElements", activitiesPage.getTotalElements());
            response.put("totalPages", activitiesPage.getTotalPages());
            response.put("currentPage", page);
            response.put("hasNext", activitiesPage.hasNext());
            response.put("hasPrevious", activitiesPage.hasPrevious());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Грешка при филтрирането на активностите: " + e.getMessage()));
        }
    }

    // ===== STATISTICS =====

    /**
     * Връща статистики за Activity Wall dashboard
     */
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getActivityStatistics() {

        try {
            Map<String, Object> stats = activityLogService.getActivityStatistics();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("stats", stats);
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Грешка при получаването на статистики: " + e.getMessage()));
        }
    }

    /**
     * Връща най-активните потребители
     */
    @GetMapping("/top-users")
    public ResponseEntity<Map<String, Object>> getTopUsers(
            @RequestParam(defaultValue = "24") int hours,
            @RequestParam(defaultValue = "10") int limit) {

        try {
            hours = Math.min(Math.max(1, hours), 168); // Между 1 час и 1 седмица
            limit = Math.min(Math.max(1, limit), 50);

            List<Map<String, Object>> topUsers = activityLogService.getMostActiveUsers(hours, limit);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("topUsers", topUsers);
            response.put("hours", hours);
            response.put("limit", limit);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Грешка при получаването на топ потребители: " + e.getMessage()));
        }
    }

    /**
     * Връща най-честите действия
     */
    @GetMapping("/top-actions")
    public ResponseEntity<Map<String, Object>> getTopActions(
            @RequestParam(defaultValue = "24") int hours) {

        try {
            hours = Math.min(Math.max(1, hours), 168);

            List<Map<String, Object>> topActions = activityLogService.getMostFrequentActions(hours);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("topActions", topActions);
            response.put("hours", hours);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Грешка при получаването на топ действия: " + e.getMessage()));
        }
    }

    // ===== ENTITY ACTIVITIES =====

    /**
     * Връща всички активности за конкретен entity
     */
    @GetMapping("/entity/{entityType}/{entityId}")
    public ResponseEntity<Map<String, Object>> getEntityActivities(
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

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Грешка при получаването на активности за entity: " + e.getMessage()));
        }
    }

    // ===== USER ACTIVITIES =====

    /**
     * Връща активности за конкретен потребител
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<Map<String, Object>> getUserActivities(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        try {
            page = Math.max(0, page);
            size = Math.min(Math.max(1, size), 200);

            Pageable pageable = PageRequest.of(page, size);
            Page<ActivityLogEntity> activitiesPage = activityLogService.getActivitiesForUser(userId, pageable);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("activities", convertActivitiesToJson(activitiesPage.getContent()));
            response.put("userId", userId);
            response.put("totalElements", activitiesPage.getTotalElements());
            response.put("totalPages", activitiesPage.getTotalPages());
            response.put("currentPage", page);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Грешка при получаването на потребителски активности: " + e.getMessage()));
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

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Грешка при получаването на IP активности: " + e.getMessage()));
        }
    }

    // ===== EXPORT =====

    /**
     * Експортира активности към CSV файл
     */
    @GetMapping("/export")
    public ResponseEntity<String> exportActivities(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {

        try {
            LocalDateTime fromDate = from != null ? LocalDateTime.parse(from) : LocalDateTime.now().minusDays(7);
            LocalDateTime toDate = to != null ? LocalDateTime.parse(to) : LocalDateTime.now();

            String csvContent = activityLogService.exportActivitiesToCsv(fromDate, toDate);

            String filename = String.format("activity_logs_%s_to_%s.csv",
                    fromDate.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")),
                    toDate.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType("text/csv"))
                    .body(csvContent);

        } catch (Exception e) {
            return ResponseEntity.status(500).body("Грешка при експортирането: " + e.getMessage());
        }
    }

    // ===== MAINTENANCE =====

    /**
     * Ръчно изчистване на стари активности
     */
    @PostMapping("/cleanup")
    public ResponseEntity<Map<String, Object>> cleanupOldActivities(
            @RequestParam(required = false) Integer daysToKeep) {

        try {
            // Ако не е подаден параметър, използваме 30 дни по подразбиране
            if (daysToKeep == null || daysToKeep <= 0) {
                daysToKeep = 30;
            }

            long deletedCount = activityLogService.cleanupOldActivities(daysToKeep);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("deletedCount", deletedCount);
            response.put("message", "Изтрити са " + deletedCount + " стари записа (по-стари от " + daysToKeep + " дни)");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Грешка при изчистването: " + e.getMessage()));
        }
    }

    /**
     * Връща статистики за таблицата с активности
     */
    @GetMapping("/table-stats")
    public ResponseEntity<Map<String, Object>> getTableStatistics() {

        try {
            Map<String, Object> stats = activityLogService.getTableStatistics();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("tableStats", stats);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Грешка при получаването на статистики за таблицата: " + e.getMessage()));
        }
    }

    // ===== HELPER METHODS =====

    private List<Map<String, Object>> convertActivitiesToJson(List<ActivityLogEntity> activities) {
        return activities.stream().map(this::convertActivityToJson).toList();
    }

    private Map<String, Object> convertActivityToJson(ActivityLogEntity activity) {
        Map<String, Object> json = new HashMap<>();
        json.put("id", activity.getId());
        json.put("timestamp", activity.getTimestamp().toString());
        json.put("userId", activity.getUserId());
        json.put("username", activity.getUsername());
        json.put("action", activity.getAction());
        json.put("entityType", activity.getEntityType());
        json.put("entityId", activity.getEntityId());
        json.put("details", activity.getDetails());
        json.put("ipAddress", activity.getIpAddress());
        json.put("userAgent", activity.getUserAgent());

        // Добавяме type за frontend филтрирането
        json.put("type", determineActivityType(activity.getAction()));

        return json;
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

    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("error", message);
        response.put("timestamp", LocalDateTime.now());
        return response;
    }
}