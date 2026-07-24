package smolyanVote.smolyanVote.controllers;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import smolyanVote.smolyanVote.services.interfaces.AdminOverviewService;

import java.util.Map;

@RestController
@RequestMapping("/admin/api")
@PreAuthorize("hasRole('ADMIN')")
public class AdminOverviewController {

    private final AdminOverviewService adminOverviewService;

    public AdminOverviewController(AdminOverviewService adminOverviewService) {
        this.adminOverviewService = adminOverviewService;
    }

    @GetMapping(value = "/overview", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> overview() {
        return ResponseEntity.ok(adminOverviewService.getOverview());
    }

    @GetMapping(value = "/health-alerts", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> healthAlerts() {
        return ResponseEntity.ok(adminOverviewService.getHealthAlerts());
    }
}
