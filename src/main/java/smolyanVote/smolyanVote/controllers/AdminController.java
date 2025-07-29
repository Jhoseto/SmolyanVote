package smolyanVote.smolyanVote.controllers;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import smolyanVote.smolyanVote.services.interfaces.ActuatorDataService;

import java.util.Map;

@Controller
@RequestMapping("/admin")
public class AdminController {

    private final ActuatorDataService actuatorDataService;

    public AdminController(ActuatorDataService actuatorDataService) {
        this.actuatorDataService = actuatorDataService;
    }

    @GetMapping("/dashboard")
    public String adminDashboard() {
        return "admin/dashboard";
    }

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

    @GetMapping("/api/metrics/system")
    @ResponseBody
    public Map<String, Object> getSystemMetrics() {
        return actuatorDataService.getSystemMetrics();
    }

    @GetMapping("/api/metrics/memory")
    @ResponseBody
    public Map<String, Object> getMemoryMetrics() {
        return actuatorDataService.getDetailedMemoryStats();
    }

    @GetMapping("/api/metrics/performance")
    @ResponseBody
    public Map<String, Object> getPerformanceMetrics() {
        return actuatorDataService.getResponseTimeMetrics();
    }

    @GetMapping("/api/metrics/errors")
    @ResponseBody
    public Map<String, Object> getErrorMetrics() {
        return actuatorDataService.getErrorRates();
    }
}