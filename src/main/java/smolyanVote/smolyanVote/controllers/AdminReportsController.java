package smolyanVote.smolyanVote.controllers;

import org.springframework.data.domain.*;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import smolyanVote.smolyanVote.models.ReportsEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.ReportableEntityType;
import smolyanVote.smolyanVote.repositories.ReportsRepository;
import smolyanVote.smolyanVote.services.interfaces.ReportsService;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.viewsAndDTO.GroupedReportsDTO;

import java.util.*;

@RestController
@RequestMapping("/admin/manage-reports")
public class AdminReportsController {

    private final ReportsService reportsService;
    private final UserService userService;
    private final ReportsRepository reportsRepository;

    public AdminReportsController(ReportsService reportsService,
                                  UserService userService,
                                  ReportsRepository reportsRepository) {
        this.reportsService = reportsService;
        this.userService = userService;
        this.reportsRepository = reportsRepository;
    }

    @GetMapping(value = "/statistics", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> getReportsStatistics() {
        try {
            Map<String, Object> stats = reportsService.getReportsStatistics();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Грешка при статистиката: " + e.getMessage()));
        }
    }

    @GetMapping(value = "/grouped", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Page<GroupedReportsDTO>> getGroupedReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<GroupedReportsDTO> groupedReports = reportsService.getGroupedReports(pageable);
            return ResponseEntity.ok(groupedReports);
        } catch (Exception e) {
            System.err.println("Error in getGroupedReports: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping(value = "/grouped/bulk-review", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, String>> bulkReviewGroupedReports(@RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> entityGroups = (List<Map<String, Object>>) request.get("entityGroups");
            String status = (String) request.get("status");
            String adminNotes = (String) request.get("adminNotes");

            UserEntity admin = userService.getCurrentUser();
            int totalReports = 0;

            for (Map<String, Object> group : entityGroups) {
                String entityTypeStr = (String) group.get("entityType");
                Long entityId = Long.valueOf(group.get("entityId").toString());

                ReportableEntityType entityType = ReportableEntityType.valueOf(entityTypeStr);
                List<Long> reportIds = reportsService.getReportIdsByEntity(entityType, entityId);

                for (Long reportId : reportIds) {
                    reportsService.reviewReport(reportId, admin, status, adminNotes);
                }

                totalReports += reportIds.size();
            }

            return ResponseEntity.ok(Map.of("message", totalReports + " репорта обработени успешно"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Грешка при прегледа: " + e.getMessage()));
        }
    }

    @PostMapping(value = "/bulk-delete", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, String>> bulkDeleteReports(@RequestBody List<Long> reportIds) {
        try {
            reportsRepository.deleteAllById(reportIds);
            return ResponseEntity.ok(Map.of("message", reportIds.size() + " репорта изтрити успешно"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Грешка при изтриване: " + e.getMessage()));
        }
    }

    @PostMapping(value = "/{reportId}/review", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, String>> reviewReport(
            @PathVariable Long reportId,
            @RequestBody Map<String, String> request,
            Authentication auth) {
        try {
            UserEntity admin = userService.getCurrentUser();
            String status = request.get("status");
            String adminNotes = request.get("adminNotes");

            reportsService.reviewReport(reportId, admin, status, adminNotes);
            return ResponseEntity.ok(Map.of("message", "Докладът е прегледан успешно"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Грешка при прегледа: " + e.getMessage()));
        }
    }

    @DeleteMapping(value = "/{reportId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, String>> deleteReport(@PathVariable Long reportId) {
        try {
            if (!reportsRepository.existsById(reportId)) {
                return ResponseEntity.status(404).body(Map.of("error", "Докладът не е намерен"));
            }
            reportsRepository.deleteById(reportId);
            return ResponseEntity.ok(Map.of("message", "Докладът е изтрит успешно"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Грешка при изтриване: " + e.getMessage()));
        }
    }

    @GetMapping(value = "/{reportId}/details", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ReportsEntity> getReportDetails(@PathVariable Long reportId) {
        try {
            return reportsRepository.findById(reportId)
                    .map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping(value = "/{reportId}/notes", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, String>> saveAdminNotes(
            @PathVariable Long reportId,
            @RequestBody Map<String, String> request) {
        try {
            String adminNotes = request.get("adminNotes");
            Optional<ReportsEntity> reportOpt = reportsRepository.findById(reportId);
            if (reportOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Докладът не е намерен"));
            }
            ReportsEntity report = reportOpt.get();
            report.setAdminNotes(adminNotes);
            reportsRepository.save(report);
            return ResponseEntity.ok(Map.of("message", "Бележките са запазени успешно"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Грешка при запазване: " + e.getMessage()));
        }
    }
}
