package smolyanVote.smolyanVote.controllers;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import smolyanVote.smolyanVote.models.*;
import smolyanVote.smolyanVote.models.enums.ReportableEntityType;
import smolyanVote.smolyanVote.repositories.*;
import smolyanVote.smolyanVote.services.interfaces.ActuatorDataService;
import smolyanVote.smolyanVote.services.interfaces.ReportsService;
import smolyanVote.smolyanVote.services.interfaces.UserService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final ActuatorDataService actuatorDataService;
    private final ReportsService reportsService;
    private final UserService userService;
    private final ReportsRepository reportsRepository;

    public AdminController(ActuatorDataService actuatorDataService,
                           ReportsService reportsService,
                           UserService userService,
                           ReportsRepository reportsRepository) {
        this.actuatorDataService = actuatorDataService;
        this.reportsService = reportsService;
        this.userService = userService;
        this.reportsRepository = reportsRepository;
    }

    @GetMapping("/dashboard")
    public String adminDashboard() {
        return "admin/dashboard";
    }

    // ===== ОСНОВНИ ENDPOINTS =====

    @GetMapping("/api/health")
    @ResponseBody
    public Map<String, Object> getHealthData() {
        return actuatorDataService.getHealthData();
    }

    @GetMapping("/api/metrics")
    @ResponseBody
    public Map<String, Object> getMetrics() {
        return actuatorDataService.getSystemMetrics();
    }

    @GetMapping("/api/info")
    @ResponseBody
    public Map<String, Object> getAppInfo() {
        return actuatorDataService.getApplicationInfo();
    }

    // ===== HEALTH STATUS ENDPOINTS =====

    @GetMapping("/api/health/database")
    @ResponseBody
    public Map<String, Object> getDatabaseHealth() {
        return actuatorDataService.getDatabaseHealth();
    }

    @GetMapping("/api/health/cloudinary")
    @ResponseBody
    public Map<String, Object> getCloudinaryHealth() {
        return actuatorDataService.getCloudinaryHealth();
    }

    @GetMapping("/api/health/email")
    @ResponseBody
    public Map<String, Object> getEmailHealth() {
        return actuatorDataService.getEmailServiceHealth();
    }

    // ===== PERFORMANCE METRICS ENDPOINTS =====

    @GetMapping("/api/metrics/response-time")
    @ResponseBody
    public Map<String, Object> getResponseTimeMetrics() {
        return actuatorDataService.getResponseTimeMetrics();
    }

    @GetMapping("/api/metrics/http-status")
    @ResponseBody
    public Map<String, Object> getHttpStatusMetrics() {
        return actuatorDataService.getHttpStatusMetrics();
    }

    @GetMapping("/api/metrics/jvm")
    @ResponseBody
    public Map<String, Object> getJvmMetrics() {
        return actuatorDataService.getJvmMetrics();
    }

    // ===== RESOURCE USAGE ENDPOINTS =====

    @GetMapping("/api/resources/disk")
    @ResponseBody
    public Map<String, Object> getDiskSpaceInfo() {
        return actuatorDataService.getDiskSpaceInfo();
    }

    @GetMapping("/api/resources/database-pool")
    @ResponseBody
    public Map<String, Object> getDatabaseConnectionPool() {
        return actuatorDataService.getDatabaseConnectionPool();
    }

    @GetMapping("/api/resources/memory")
    @ResponseBody
    public Map<String, Object> getDetailedMemoryStats() {
        return actuatorDataService.getDetailedMemoryStats();
    }

    // ===== ERROR MONITORING ENDPOINTS =====

    @GetMapping("/api/errors/recent")
    @ResponseBody
    public Map<String, Object> getRecentErrors() {
        return actuatorDataService.getRecentErrors();
    }

    @GetMapping("/api/errors/rates")
    @ResponseBody
    public Map<String, Object> getErrorRates() {
        return actuatorDataService.getErrorRates();
    }

    // ===== COMBINED DASHBOARD DATA ENDPOINT =====

    @GetMapping("/api/dashboard-data")
    @ResponseBody
    public Map<String, Object> getDashboardData() {
        return Map.of(
                "health", actuatorDataService.getHealthData(),
                "metrics", actuatorDataService.getSystemMetrics(),
                "appInfo", actuatorDataService.getApplicationInfo(),
                "dbHealth", actuatorDataService.getDatabaseHealth(),
                "jvmMetrics", actuatorDataService.getJvmMetrics(),
                "diskSpace", actuatorDataService.getDiskSpaceInfo(),
                "dbPool", actuatorDataService.getDatabaseConnectionPool(),
                "errorRates", actuatorDataService.getErrorRates()
        );
    }

    // ===== REPORTS MANAGEMENT ENDPOINTS =====

    @GetMapping("/api/reports/statistics")
    @ResponseBody
    public Map<String, Object> getReportsStatistics() {
        return reportsService.getReportsStatistics();
    }

    @GetMapping("/api/reports/pending")
    @ResponseBody
    public Page<ReportsEntity> getPendingReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        Pageable pageable = PageRequest.of(page, size);
        return reportsService.getPendingReports(pageable);
    }

    @GetMapping("/api/reports/{reportId}/details")
    @ResponseBody
    public ResponseEntity<ReportsEntity> getReportDetails(@PathVariable Long reportId) {
        Optional<ReportsEntity> report = reportsRepository.findById(reportId);

        if (report.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(report.get());
    }

    @PostMapping("/api/reports/{reportId}/review")
    @ResponseBody
    public ResponseEntity<Map<String, String>> reviewReport(
            @PathVariable Long reportId,
            @RequestBody Map<String, String> request,
            Authentication auth) {

        try {
            UserEntity admin = userService.getCurrentUser();
            String status = request.get("status");
            String adminNotes = request.get("adminNotes");

            reportsService.reviewReport(reportId, admin, status, adminNotes);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Докладът е обработен успешно");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/api/reports/{reportId}/notes")
    @ResponseBody
    public ResponseEntity<Map<String, String>> saveAdminNotes(
            @PathVariable Long reportId,
            @RequestBody Map<String, String> request) {

        try {
            String adminNotes = request.get("adminNotes");

            Optional<ReportsEntity> reportOpt = reportsRepository.findById(reportId);
            if (reportOpt.isEmpty()) {
                throw new IllegalArgumentException("Докладът не е намерен");
            }

            ReportsEntity report = reportOpt.get();
            report.setAdminNotes(adminNotes);
            reportsRepository.save(report);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Бележките са запазени");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }


    @GetMapping("/api/reports/all")
    @ResponseBody
    public Page<ReportsEntity> getAllReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "500") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return reportsRepository.findAll(pageable);
    }





    @DeleteMapping("/api/reports/{reportId}")
    @ResponseBody
    public ResponseEntity<Map<String, String>> deleteReport(@PathVariable Long reportId) {
        try {
            reportsRepository.deleteById(reportId);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Report deleted successfully");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/api/reports/bulk-delete")
    @ResponseBody
    public ResponseEntity<Map<String, String>> bulkDeleteReports(@RequestBody List<Long> reportIds) {
        try {
            reportsRepository.deleteAllById(reportIds);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Reports deleted successfully");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/api/reports/bulk-review")
    @ResponseBody
    public ResponseEntity<Map<String, String>> bulkReviewReports(@RequestBody Map<String, Object> request) {
        System.out.println(request.toString());
        try {
            @SuppressWarnings("unchecked")
            List<Long> reportIds = (List<Long>) request.get("reportIds");
            String status = (String) request.get("status");
            String adminNotes = (String) request.get("adminNotes");

            UserEntity admin = userService.getCurrentUser();

            for (Long reportId : reportIds) {
                reportsService.reviewReport(reportId, admin, status, adminNotes);
            }

            Map<String, String> response = new HashMap<>();
            response.put("message", "Reports reviewed successfully");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

}