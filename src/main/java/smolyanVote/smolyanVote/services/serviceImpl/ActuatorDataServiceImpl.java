package smolyanVote.smolyanVote.services.serviceImpl;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import io.micrometer.core.instrument.Gauge;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.health.HealthComponent;
import org.springframework.boot.actuate.health.HealthEndpoint;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import smolyanVote.smolyanVote.services.interfaces.ActuatorDataService;

import javax.sql.DataSource;
import java.io.File;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.OperatingSystemMXBean;
import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
public class ActuatorDataServiceImpl implements ActuatorDataService {

    private final HealthEndpoint healthEndpoint;
    private final MeterRegistry meterRegistry;
    private final DataSource dataSource;
    private final Environment environment;

    @Autowired
    public ActuatorDataServiceImpl(HealthEndpoint healthEndpoint,
                                   MeterRegistry meterRegistry,
                                   DataSource dataSource,
                                   Environment environment) {
        this.healthEndpoint = healthEndpoint;
        this.meterRegistry = meterRegistry;
        this.dataSource = dataSource;
        this.environment = environment;
    }

    @Override
    public Map<String, Object> getHealthData() {
        Map<String, Object> healthData = new HashMap<>();

        try {
            HealthComponent health = healthEndpoint.health();
            healthData.put("status", health.getStatus().getCode());

            if (health instanceof org.springframework.boot.actuate.health.CompositeHealth) {
                org.springframework.boot.actuate.health.CompositeHealth compositeHealth =
                        (org.springframework.boot.actuate.health.CompositeHealth) health;
                healthData.put("details", compositeHealth.getComponents());
            }
        } catch (Exception e) {
            healthData.put("status", "UNKNOWN");
            healthData.put("error", "Health check failed: " + e.getMessage());
        }

        return healthData;
    }

    @Override
    public Map<String, Object> getSystemMetrics() {
        Map<String, Object> metrics = new HashMap<>();

        try {
            // CPU Usage - with fallback
            Double cpuUsage = getCpuUsage();
            metrics.put("cpuUsage", cpuUsage);

            // Memory Usage - JVM guaranteed to work
            MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
            long usedMemory = memoryBean.getHeapMemoryUsage().getUsed();
            long maxMemory = memoryBean.getHeapMemoryUsage().getMax();

            metrics.put("memoryUsed", usedMemory);
            metrics.put("memoryMax", maxMemory);
            metrics.put("memoryUsagePercent", maxMemory > 0 ? Math.round((double) usedMemory / maxMemory * 100.0 * 100.0) / 100.0 : 0.0);

            // Threads - JVM guaranteed
            metrics.put("activeThreads", ManagementFactory.getThreadMXBean().getThreadCount());

            // HTTP Requests - with safety check
            Double totalRequests = getHttpRequestCount();
            metrics.put("totalHttpRequests", totalRequests);

        } catch (Exception e) {
            metrics.put("error", "System metrics failed: " + e.getMessage());
        }

        return metrics;
    }

    @Override
    public Map<String, Object> getApplicationInfo() {
        Map<String, Object> appInfo = new HashMap<>();

        try {
            long uptimeMillis = ManagementFactory.getRuntimeMXBean().getUptime();
            long uptimeMinutes = uptimeMillis / (1000 * 60);
            appInfo.put("uptimeMinutes", uptimeMinutes);
            appInfo.put("uptimeFormatted", formatUptime(uptimeMillis));

            appInfo.put("name", environment.getProperty("spring.application.name", "smolyanVote"));
            appInfo.put("applicationName", appInfo.get("name"));
            appInfo.put("version", environment.getProperty("spring.application.version", "1"));
            appInfo.put("appVersion", appInfo.get("version"));

            appInfo.put("javaVersion", System.getProperty("java.version"));
            appInfo.put("jvmName", ManagementFactory.getRuntimeMXBean().getVmName());
            appInfo.put("environment", getEnvironmentName());
            appInfo.put("serverPort", environment.getProperty("server.port", "unknown"));

        } catch (Exception e) {
            appInfo.put("error", "App info failed: " + e.getMessage());
        }

        return appInfo;
    }

    @Override
    public Map<String, Object> getDatabaseHealth() {
        Map<String, Object> dbHealth = new HashMap<>();

        try {
            Connection connection = dataSource.getConnection();
            boolean isValid = connection.isValid(3); // Reduced timeout for production
            connection.close();

            dbHealth.put("status", isValid ? "UP" : "DOWN");
            dbHealth.put("responseTime", isValid ? "< 3s" : "TIMEOUT");
            dbHealth.put("url", maskDatabaseUrl(environment.getProperty("spring.datasource.url")));

        } catch (Exception e) {
            dbHealth.put("status", "DOWN");
            dbHealth.put("error", "DB connection failed");
            // Don't expose sensitive error details in production
        }

        return dbHealth;
    }

    @Override
    public Map<String, Object> getCloudinaryHealth() {
        Map<String, Object> cloudinaryHealth = new HashMap<>();

        try {
            String cloudName = resolveEnvironmentVariable("cloudinary.cloud_name", "CLOUDINARY_CLOUD_NAME");
            String apiKey = resolveEnvironmentVariable("cloudinary.api_key", "CLOUDINARY_API_KEY");

            boolean hasCloudName = isValidValue(cloudName);
            boolean hasApiKey = isValidValue(apiKey);

            if (hasCloudName && hasApiKey) {
                cloudinaryHealth.put("status", "UP");
                cloudinaryHealth.put("cloudName", cloudName);
                cloudinaryHealth.put("configured", true);
            } else {
                cloudinaryHealth.put("status", "DOWN");
                cloudinaryHealth.put("configured", false);
                cloudinaryHealth.put("error", "Cloudinary configuration missing");
            }

        } catch (Exception e) {
            cloudinaryHealth.put("status", "DOWN");
            cloudinaryHealth.put("error", "Cloudinary check failed");
            cloudinaryHealth.put("configured", false);
        }

        return cloudinaryHealth;
    }

    @Override
    public Map<String, Object> getEmailServiceHealth() {
        Map<String, Object> emailHealth = new HashMap<>();

        try {
            String mailjetApiKey = resolveEnvironmentVariable("mailjet.api.key", "MAILJET_API_KEY");
            String mailjetApiSecret = resolveEnvironmentVariable("mailjet.api.secret", "MAILJET_API_SECRET");
            String mailjetSenderEmail = environment.getProperty("mailjet.sender.email");

            boolean hasApiKey = isValidValue(mailjetApiKey);
            boolean hasApiSecret = isValidValue(mailjetApiSecret);
            boolean hasSenderEmail = isValidValue(mailjetSenderEmail);

            if (hasApiKey && hasApiSecret && hasSenderEmail) {
                emailHealth.put("status", "UP");
                emailHealth.put("service", "Mailjet");
                emailHealth.put("senderEmail", mailjetSenderEmail);
                emailHealth.put("configured", true);
            } else {
                emailHealth.put("status", "DOWN");
                emailHealth.put("service", "Mailjet");
                emailHealth.put("configured", false);
                emailHealth.put("error", "Mailjet configuration incomplete");
            }

        } catch (Exception e) {
            emailHealth.put("status", "DOWN");
            emailHealth.put("error", "Email service check failed");
            emailHealth.put("configured", false);
        }

        return emailHealth;
    }

    @Override
    public Map<String, Object> getResponseTimeMetrics() {
        Map<String, Object> responseMetrics = new HashMap<>();

        try {
            Timer httpTimer = meterRegistry.find("http.server.requests").timer();
            if (httpTimer != null && httpTimer.count() > 0) {
                double avg = Math.round(httpTimer.mean(TimeUnit.MILLISECONDS) * 100.0) / 100.0;
                double max = Math.round(httpTimer.max(TimeUnit.MILLISECONDS) * 100.0) / 100.0;
                responseMetrics.put("averageResponseTime", avg);
                responseMetrics.put("average", avg);
                responseMetrics.put("avg", avg);
                responseMetrics.put("maxResponseTime", max);
                responseMetrics.put("max", max);
                responseMetrics.put("maximum", max);
                responseMetrics.put("requestCount", httpTimer.count());
                // Percentiles only when histogram is enabled in Micrometer
                double p95 = percentileMs(httpTimer, 0.95);
                double p99 = percentileMs(httpTimer, 0.99);
                if (p95 >= 0) {
                    responseMetrics.put("p95", p95);
                    responseMetrics.put("percentile95", p95);
                }
                if (p99 >= 0) {
                    responseMetrics.put("p99", p99);
                    responseMetrics.put("percentile99", p99);
                }
            } else {
                responseMetrics.put("averageResponseTime", 0.0);
                responseMetrics.put("maxResponseTime", 0.0);
                responseMetrics.put("requestCount", 0.0);
                responseMetrics.put("note", "No HTTP requests recorded yet");
            }
        } catch (Exception e) {
            responseMetrics.put("error", "Response time metrics unavailable");
        }

        return responseMetrics;
    }

    @Override
    public Map<String, Object> getHttpStatusMetrics() {
        Map<String, Object> statusMetrics = new HashMap<>();

        try {
            double count200 = getHttpStatusCount("200");
            double count404 = getHttpStatusCount("404");
            double count500 = getHttpStatusCount("500");
            HttpStatusBuckets buckets = getHttpStatusBuckets();

            statusMetrics.put("status200", count200);
            statusMetrics.put("200", count200);
            statusMetrics.put("status404", count404);
            statusMetrics.put("404", count404);
            statusMetrics.put("status500", count500);
            statusMetrics.put("500", count500);
            statusMetrics.put("2xx", buckets.twoXx);
            statusMetrics.put("3xx", buckets.threeXx);
            statusMetrics.put("4xx", buckets.fourXx);
            statusMetrics.put("5xx", buckets.fiveXx);
            statusMetrics.put("total", buckets.twoXx + buckets.threeXx + buckets.fourXx + buckets.fiveXx);

        } catch (Exception e) {
            statusMetrics.put("error", "HTTP status metrics unavailable");
        }

        return statusMetrics;
    }

    @Override
    public Map<String, Object> getJvmMetrics() {
        Map<String, Object> jvmMetrics = new HashMap<>();

        try {
            MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();

            // Memory info - guaranteed to work
            jvmMetrics.put("heapMemoryUsed", memoryBean.getHeapMemoryUsage().getUsed());
            jvmMetrics.put("heapMemoryMax", memoryBean.getHeapMemoryUsage().getMax());
            jvmMetrics.put("nonHeapMemoryUsed", memoryBean.getNonHeapMemoryUsage().getUsed());
            jvmMetrics.put("heapUsed", memoryBean.getHeapMemoryUsage().getUsed());
            jvmMetrics.put("usedHeap", memoryBean.getHeapMemoryUsage().getUsed());
            jvmMetrics.put("heapMax", memoryBean.getHeapMemoryUsage().getMax());
            jvmMetrics.put("maxHeap", memoryBean.getHeapMemoryUsage().getMax());
            jvmMetrics.put("nonHeapUsed", memoryBean.getNonHeapMemoryUsage().getUsed());
            jvmMetrics.put("usedNonHeap", memoryBean.getNonHeapMemoryUsage().getUsed());

            jvmMetrics.put("threadsLive", ManagementFactory.getThreadMXBean().getThreadCount());
            jvmMetrics.put("liveThreads", ManagementFactory.getThreadMXBean().getThreadCount());
            jvmMetrics.put("threadCount", ManagementFactory.getThreadMXBean().getThreadCount());
            jvmMetrics.put("threadsPeak", ManagementFactory.getThreadMXBean().getPeakThreadCount());

            try {
                long gcTime = ManagementFactory.getGarbageCollectorMXBeans()
                        .stream()
                        .mapToLong(gc -> gc.getCollectionTime())
                        .sum();
                long gcCount = ManagementFactory.getGarbageCollectorMXBeans()
                        .stream()
                        .mapToLong(gc -> gc.getCollectionCount())
                        .sum();
                jvmMetrics.put("gcTimeMs", gcTime);
                jvmMetrics.put("gcCount", gcCount);
                jvmMetrics.put("garbageCollectionCount", gcCount);
            } catch (Exception e) {
                jvmMetrics.put("gcTimeMs", "N/A");
            }

        } catch (Exception e) {
            jvmMetrics.put("error", "JVM metrics failed: " + e.getMessage());
        }

        return jvmMetrics;
    }

    @Override
    public Map<String, Object> getDiskSpaceInfo() {
        Map<String, Object> diskInfo = new HashMap<>();

        try {
            // Try multiple locations for production compatibility
            File[] candidates = {
                    new File(System.getProperty("user.dir")), // Current directory
                    new File("/"),                             // Root filesystem
                    new File("/tmp"),                          // Temp directory (usually accessible)
                    new File(System.getProperty("java.io.tmpdir")) // Java temp
            };

            for (File location : candidates) {
                try {
                    if (location.exists() && location.canRead()) {
                        long totalSpace = location.getTotalSpace();
                        long freeSpace = location.getFreeSpace();
                        long usedSpace = totalSpace - freeSpace;

                        if (totalSpace > 0) {
                            diskInfo.put("location", location.getAbsolutePath());
                            diskInfo.put("total", totalSpace);
                            diskInfo.put("totalSpace", totalSpace);
                            diskInfo.put("free", freeSpace);
                            diskInfo.put("freeSpace", freeSpace);
                            diskInfo.put("totalSpaceGB", Math.round(totalSpace / (1024.0 * 1024.0 * 1024.0) * 100.0) / 100.0);
                            diskInfo.put("freeSpaceGB", Math.round(freeSpace / (1024.0 * 1024.0 * 1024.0) * 100.0) / 100.0);
                            diskInfo.put("usedSpaceGB", Math.round(usedSpace / (1024.0 * 1024.0 * 1024.0) * 100.0) / 100.0);
                            diskInfo.put("usagePercent", Math.round((double) usedSpace / totalSpace * 100.0 * 100.0) / 100.0);
                            diskInfo.put("usedPercent", diskInfo.get("usagePercent"));
                            break;
                        }
                    }
                } catch (Exception e) {
                    // Try next location
                    continue;
                }
            }

            if (!diskInfo.containsKey("totalSpaceGB")) {
                diskInfo.put("error", "Disk space information not accessible in this environment");
                diskInfo.put("note", "Common in containerized deployments");
            }

        } catch (Exception e) {
            diskInfo.put("error", "Disk space check failed");
        }

        return diskInfo;
    }

    @Override
    public Map<String, Object> getDatabaseConnectionPool() {
        Map<String, Object> poolInfo = new HashMap<>();

        try {
            // HikariCP metrics - may not be enabled by default
            Gauge activeConnections = meterRegistry.find("hikaricp.connections.active").gauge();
            Gauge totalConnections = meterRegistry.find("hikaricp.connections").gauge();
            Gauge idleConnections = meterRegistry.find("hikaricp.connections.idle").gauge();
            Gauge maxConnections = meterRegistry.find("hikaricp.connections.max").gauge();
            Gauge pendingConnections = meterRegistry.find("hikaricp.connections.pending").gauge();

            if (activeConnections != null) {
                poolInfo.put("active", Math.round(activeConnections.value()));
                poolInfo.put("activeConnections", Math.round(activeConnections.value()));
                poolInfo.put("total", totalConnections != null ? Math.round(totalConnections.value()) : "N/A");
                poolInfo.put("idle", idleConnections != null ? Math.round(idleConnections.value()) : "N/A");
                poolInfo.put("idleConnections", poolInfo.get("idle"));
                poolInfo.put("max", maxConnections != null ? Math.round(maxConnections.value()) : "N/A");
                poolInfo.put("maxConnections", poolInfo.get("max"));
                poolInfo.put("pending", pendingConnections != null ? Math.round(pendingConnections.value()) : "N/A");
                poolInfo.put("metricsEnabled", true);
            } else {
                // Fallback - try to get info from DataSource
                poolInfo.put("active", "Metrics not enabled");
                poolInfo.put("total", "Metrics not enabled");
                poolInfo.put("pending", "Metrics not enabled");
                poolInfo.put("metricsEnabled", false);
                poolInfo.put("note", "Enable with: spring.datasource.hikari.register-mbeans=true");
            }

        } catch (Exception e) {
            poolInfo.put("error", "DB pool metrics unavailable");
        }

        return poolInfo;
    }

    @Override
    public Map<String, Object> getDetailedMemoryStats() {
        Map<String, Object> memoryStats = new HashMap<>();

        try {
            MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();

            // Heap Memory - guaranteed
            memoryStats.put("heapUsed", memoryBean.getHeapMemoryUsage().getUsed());
            memoryStats.put("heapMax", memoryBean.getHeapMemoryUsage().getMax());
            memoryStats.put("heapCommitted", memoryBean.getHeapMemoryUsage().getCommitted());

            // Non-Heap Memory - guaranteed
            memoryStats.put("nonHeapUsed", memoryBean.getNonHeapMemoryUsage().getUsed());
            memoryStats.put("nonHeapMax", memoryBean.getNonHeapMemoryUsage().getMax());
            memoryStats.put("nonHeapCommitted", memoryBean.getNonHeapMemoryUsage().getCommitted());

        } catch (Exception e) {
            memoryStats.put("error", "Memory stats failed: " + e.getMessage());
        }

        return memoryStats;
    }

    @Override
    public Map<String, Object> getRecentErrors() {
        Map<String, Object> errors = new HashMap<>();

        try {
            double http5xxCount = getHttp5xxCount();
            errors.put("http5xxCount", http5xxCount);
            errors.put("totalErrors", http5xxCount);

            // JVM Error indicators
            long totalGcTime = ManagementFactory.getGarbageCollectorMXBeans()
                    .stream()
                    .mapToLong(gc -> gc.getCollectionTime())
                    .sum();
            errors.put("totalGcTimeMs", totalGcTime);

        } catch (Exception e) {
            errors.put("error", "Error metrics unavailable");
        }

        return errors;
    }

    @Override
    public Map<String, Object> getErrorRates() {
        Map<String, Object> errorRates = new HashMap<>();

        try {
            double totalRequests = getHttpRequestCount();
            double errorRequests = getHttp5xxCount();

            if (totalRequests > 0) {
                double errorRate = (errorRequests / totalRequests) * 100;
                errorRates.put("httpErrorRate", Math.round(errorRate * 100.0) / 100.0);
                errorRates.put("errorRate", errorRates.get("httpErrorRate"));
                errorRates.put("rate", errorRates.get("httpErrorRate"));
                errorRates.put("totalRequests", totalRequests);
                errorRates.put("errorRequests", errorRequests);
                errorRates.put("totalErrors", errorRequests);
                errorRates.put("total", errorRequests);
            } else {
                errorRates.put("httpErrorRate", 0.0);
                errorRates.put("errorRate", 0.0);
                errorRates.put("totalRequests", 0.0);
                errorRates.put("errorRequests", 0.0);
                errorRates.put("totalErrors", 0.0);
            }

        } catch (Exception e) {
            errorRates.put("error", "Error rate calculation failed");
        }

        return errorRates;
    }

    // ===== PRIVATE HELPER METHODS =====

    private Double getCpuUsage() {
        try {
            // Try Micrometer first
            Gauge cpuGauge = meterRegistry.find("system.cpu.usage").gauge();
            if (cpuGauge != null && cpuGauge.value() >= 0) {
                return Math.round(cpuGauge.value() * 100.0 * 100.0) / 100.0;
            }

            // Fallback to JVM
            OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();
            if (osBean instanceof com.sun.management.OperatingSystemMXBean) {
                com.sun.management.OperatingSystemMXBean sunBean = (com.sun.management.OperatingSystemMXBean) osBean;
                double processCpu = sunBean.getProcessCpuLoad();
                if (processCpu >= 0) {
                    return Math.round(processCpu * 100.0 * 100.0) / 100.0;
                }
            }

            return 0.0; // Safe fallback
        } catch (Exception e) {
            return 0.0;
        }
    }

    private Double getHttpRequestCount() {
        try {
            return meterRegistry.find("http.server.requests")
                    .timers()
                    .stream()
                    .mapToDouble(Timer::count)
                    .sum();
        } catch (Exception e) {
            return 0.0;
        }
    }

    private Double getHttpStatusCount(String status) {
        try {
            return meterRegistry.find("http.server.requests")
                    .tag("status", status)
                    .timers()
                    .stream()
                    .mapToDouble(Timer::count)
                    .sum();
        } catch (Exception e) {
            return 0.0;
        }
    }

    private double getHttp5xxCount() {
        return getHttpStatusBuckets().fiveXx;
    }

    private HttpStatusBuckets getHttpStatusBuckets() {
        HttpStatusBuckets buckets = new HttpStatusBuckets();
        try {
            meterRegistry.find("http.server.requests").timers().forEach(timer -> {
                String status = timer.getId().getTag("status");
                if (status == null) return;
                try {
                    int code = Integer.parseInt(status);
                    double count = timer.count();
                    if (code >= 200 && code < 300) buckets.twoXx += count;
                    else if (code >= 300 && code < 400) buckets.threeXx += count;
                    else if (code >= 400 && code < 500) buckets.fourXx += count;
                    else if (code >= 500) buckets.fiveXx += count;
                } catch (NumberFormatException ignored) {
                    // non-numeric status tag
                }
            });
        } catch (Exception ignored) {
            // meters unavailable
        }
        return buckets;
    }

    private double percentileMs(Timer timer, double percentile) {
        try {
            return Math.round(timer.percentile(percentile, TimeUnit.MILLISECONDS) * 100.0) / 100.0;
        } catch (Exception e) {
            return -1;
        }
    }

    private static String formatUptime(long uptimeMillis) {
        long totalMinutes = uptimeMillis / (1000 * 60);
        long days = totalMinutes / (60 * 24);
        long hours = (totalMinutes / 60) % 24;
        long minutes = totalMinutes % 60;
        if (days > 0) {
            return days + "д " + hours + "ч " + minutes + "м";
        }
        if (hours > 0) {
            return hours + "ч " + minutes + "м";
        }
        return minutes + "м";
    }

    private static final class HttpStatusBuckets {
        double twoXx;
        double threeXx;
        double fourXx;
        double fiveXx;
    }

    private String resolveEnvironmentVariable(String propertyName, String envVarName) {
        String value = environment.getProperty(propertyName);
        if (!isValidValue(value)) {
            value = environment.getProperty(envVarName);
        }
        return value;
    }

    private boolean isValidValue(String value) {
        return value != null && !value.trim().isEmpty() && !value.startsWith("${");
    }

    private String getEnvironmentName() {
        String[] profiles = environment.getActiveProfiles();
        if (profiles.length > 0) {
            return String.join(",", profiles);
        }
        return "default";
    }

    private String maskDatabaseUrl(String url) {
        if (url == null) return "N/A";
        // Mask sensitive parts for security
        return url.replaceAll("://[^@]+@", "://***:***@")
                .replaceAll("password=[^&\\s]+", "password=***");
    }
}