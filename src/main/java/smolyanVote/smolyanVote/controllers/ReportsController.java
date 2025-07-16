package smolyanVote.smolyanVote.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.ReportableEntityType;
import smolyanVote.smolyanVote.services.interfaces.ReportsService;
import smolyanVote.smolyanVote.services.interfaces.UserService;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportsController {

    private final ReportsService reportsService;
    private final UserService userService;

    @Autowired
    public ReportsController(ReportsService reportsService, UserService userService) {
        this.reportsService = reportsService;
        this.userService = userService;
    }

    // ===== СЪЗДАВАНЕ НА ДОКЛАДИ =====

    /**
     * Универсален endpoint за докладване на всякакъв entity
     * POST /api/reports/PUBLICATION/123
     * POST /api/reports/SIMPLE_EVENT/456
     * POST /api/reports/REFERENDUM/789
     * POST /api/reports/MULTI_POLL/101
     */
    @PostMapping("/{entityType}/{entityId}")
    public ResponseEntity<Map<String, Object>> createReport(
            @PathVariable String entityType,
            @PathVariable Long entityId,
            @RequestBody Map<String, String> request,
            Authentication auth) {

        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body(createErrorResponse("Необходима е автентикация"));
        }

        try {
            UserEntity user = userService.getCurrentUser();
            String reason = request.get("reason");
            String description = request.get("description");

            // Валидация на входните данни
            if (reason == null || reason.trim().isEmpty()) {
                return ResponseEntity.status(400)
                        .body(createErrorResponse("Моля, посочете причина за докладването"));
            }

            // Парсиране на entity type
            ReportableEntityType reportableEntityType;
            try {
                reportableEntityType = ReportableEntityType.valueOf(entityType.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.status(400)
                        .body(createErrorResponse("Невалиден тип обект: " + entityType));
            }

            // Предварителни проверки
            if (!reportsService.canUserReportEntity(reportableEntityType, entityId, user)) {
                return ResponseEntity.status(403)
                        .body(createErrorResponse("Не можете да докладвате " +
                                reportableEntityType.getDisplayName().toLowerCase()));
            }

            if (reportsService.hasUserReportedEntity(reportableEntityType, entityId, user.getUsername())) {
                return ResponseEntity.status(409)
                        .body(createErrorResponse("Вече сте докладвали " +
                                reportableEntityType.getDisplayName().toLowerCase()));
            }

            if (reportsService.hasUserExceededReportLimit(user)) {
                return ResponseEntity.status(429)
                        .body(createErrorResponse("Превишили сте лимита за доклади (максимум 5 на час, 20 на ден)"));
            }

            // Създаване на доклада
            reportsService.createReport(reportableEntityType, entityId, user, reason, description);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Докладът е изпратен успешно. Благодарим ви!");
            response.put("entityType", reportableEntityType.name());
            response.put("entityId", entityId);

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(createErrorResponse(e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(403).body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(createErrorResponse("Възникна грешка при докладването"));
        }
    }


    /**
     * Проверка дали потребител може да докладва entity
     * GET /api/reports/can-report/PUBLICATION/123
     */
    @GetMapping("/can-report/{entityType}/{entityId}")
    public ResponseEntity<Map<String, Object>> canUserReport(
            @PathVariable String entityType,
            @PathVariable Long entityId,
            Authentication auth) {

        Map<String, Object> response = new HashMap<>();

        if (auth == null || !auth.isAuthenticated()) {
            response.put("canReport", false);
            response.put("reason", "Необходима е автентикация");
            return ResponseEntity.ok(response);
        }

        try {
            UserEntity user = userService.getCurrentUser();
            ReportableEntityType reportableEntityType = ReportableEntityType.valueOf(entityType.toUpperCase());

            boolean canReport = reportsService.canUserReportEntity(reportableEntityType, entityId, user);
            boolean hasReported = reportsService.hasUserReportedEntity(reportableEntityType, entityId, user.getUsername());
            boolean limitExceeded = reportsService.hasUserExceededReportLimit(user);

            response.put("canReport", canReport && !hasReported && !limitExceeded);
            response.put("hasReported", hasReported);
            response.put("limitExceeded", limitExceeded);
            response.put("entityType", reportableEntityType.name());
            response.put("entityId", entityId);

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            response.put("canReport", false);
            response.put("reason", "Невалиден тип обект");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("canReport", false);
            response.put("reason", "Възникна грешка");
            return ResponseEntity.ok(response);
        }
    }


    // ===== HELPER METHODS =====

    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("error", message);
        return response;
    }
}