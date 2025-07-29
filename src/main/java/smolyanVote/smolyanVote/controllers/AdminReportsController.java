package smolyanVote.smolyanVote.controllers;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import smolyanVote.smolyanVote.models.ReportsEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.repositories.ReportsRepository;
import smolyanVote.smolyanVote.services.interfaces.ReportsService;
import smolyanVote.smolyanVote.services.interfaces.UserService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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

    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getReportsStatistics() {
        try {
            Map<String, Object> stats = reportsService.getReportsStatistics();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            System.err.println("Error in getReportsStatistics: " + e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @GetMapping("/pending")
    public ResponseEntity<Page<ReportsEntity>> getPendingReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<ReportsEntity> reports = reportsService.getPendingReports(pageable);
            return ResponseEntity.ok(reports);
        } catch (Exception e) {
            System.err.println("Error in getPendingReports: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/all")
    public ResponseEntity<Page<ReportsEntity>> getAllReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "500") int size) {

        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
            Page<ReportsEntity> reports = reportsRepository.findAll(pageable);
            return ResponseEntity.ok(reports);
        } catch (Exception e) {
            System.err.println("Error in getAllReports: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{reportId}/details")
    public ResponseEntity<ReportsEntity> getReportDetails(@PathVariable Long reportId) {
        try {
            Optional<ReportsEntity> report = reportsRepository.findById(reportId);
            if (report.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(report.get());
        } catch (Exception e) {
            System.err.println("Error in getReportDetails: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{reportId}/review")
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
            System.err.println("Error in reviewReport: " + e.getMessage());
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/{reportId}/notes")
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
            System.err.println("Error in saveAdminNotes: " + e.getMessage());
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/{reportId}")
    public ResponseEntity<Map<String, String>> deleteReport(@PathVariable Long reportId) {
        try {
            if (!reportsRepository.existsById(reportId)) {
                Map<String, String> response = new HashMap<>();
                response.put("error", "Докладът не е намерен");
                return ResponseEntity.notFound().build();
            }

            reportsRepository.deleteById(reportId);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Докладът е изтрит успешно");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Error in deleteReport: " + e.getMessage());
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/bulk-delete")
    public ResponseEntity<Map<String, String>> bulkDeleteReports(@RequestBody List<Long> reportIds) {
        try {
            reportsRepository.deleteAllById(reportIds);

            Map<String, String> response = new HashMap<>();
            response.put("message", reportIds.size() + " репорта бяха изтрити успешно");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Error in bulkDeleteReports: " + e.getMessage());
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/bulk-review")
    public ResponseEntity<Map<String, String>> bulkReviewReports(@RequestBody Map<String, Object> request) {
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
            response.put("message", reportIds.size() + " репорта бяха прегледани успешно");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Error in bulkReviewReports: " + e.getMessage());
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}