package smolyanVote.smolyanVote.services.interfaces;

import java.util.Map;

public interface ActuatorDataService {

    // Основни
    Map<String, Object> getHealthData();
    Map<String, Object> getSystemMetrics();
    Map<String, Object> getApplicationInfo();

    // Health Status
    Map<String, Object> getDatabaseHealth();
    Map<String, Object> getCloudinaryHealth();
    Map<String, Object> getEmailServiceHealth();

    // Performance Metrics
    Map<String, Object> getResponseTimeMetrics();
    Map<String, Object> getHttpStatusMetrics();
    Map<String, Object> getJvmMetrics();

    // Resource Usage
    Map<String, Object> getDiskSpaceInfo();
    Map<String, Object> getDatabaseConnectionPool();
    Map<String, Object> getDetailedMemoryStats();

    // Error Monitoring
    Map<String, Object> getRecentErrors();
    Map<String, Object> getErrorRates();
}