package smolyanVote.smolyanVote.controllers;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
@PreAuthorize("hasRole('ADMIN')")
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
        System.out.println("=== AdminReportsController CREATED - NEW PATH ===");
    }

    @GetMapping("/statistics")
    public Map<String, Object> getReportsStatistics() {
        return reportsService.getReportsStatistics();
    }

    @GetMapping("/pending")
    public Page<ReportsEntity> getPendingReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        Pageable pageable = PageRequest.of(page, size);
        return reportsService.getPendingReports(pageable);
    }

    @GetMapping("/all")
    public Page<ReportsEntity> getAllReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "500") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return reportsRepository.findAll(pageable);
    }

    @GetMapping("/{reportId}/details")
    public ResponseEntity<ReportsEntity> getReportDetails(@PathVariable Long reportId) {
        Optional<ReportsEntity> report = reportsRepository.findById(reportId);

        if (report.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(report.get());
    }

    @PostMapping("/{reportId}/review")
    public ResponseEntity<Map<String, String>> reviewReport(
            @PathVariable Long reportId,
            @RequestBody Map<String, String> request,
            Authentication auth) {

        System.out.println("!!! POST reviewReport CALLED - ID: " + reportId + " !!!");

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
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/{reportId}")
    public ResponseEntity<Map<String, String>> deleteReport(@PathVariable Long reportId) {
        System.out.println("!!! DELETE deleteReport CALLED - ID: " + reportId + " !!!");

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

    @PostMapping("/bulk-delete")
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

    @PostMapping("/bulk-review")
    public ResponseEntity<Map<String, String>> bulkReviewReports(@RequestBody Map<String, Object> request) {
        System.out.println("!!! BULK REVIEW called !!!");

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