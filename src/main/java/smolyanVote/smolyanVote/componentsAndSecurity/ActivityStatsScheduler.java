package smolyanVote.smolyanVote.componentsAndSecurity;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.ContextClosedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import smolyanVote.smolyanVote.config.websocket.ActivityWebSocketHandler;
import smolyanVote.smolyanVote.services.interfaces.ActivityLogService;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Scheduled tasks за Activity Wall система
 * Периодично изпраща статистики, поддържа WebSocket връзките и прави cleanup
 */
@Component
public class ActivityStatsScheduler {

    private final ActivityLogService activityLogService;
    private final ActivityWebSocketHandler activityWebSocketHandler;

    private boolean systemReady = false;

    @Autowired
    public ActivityStatsScheduler(ActivityLogService activityLogService,
                                  ActivityWebSocketHandler activityWebSocketHandler) {
        this.activityLogService = activityLogService;
        this.activityWebSocketHandler = activityWebSocketHandler;
    }

    @Scheduled(cron = "0 0 2 * * ?") // Всяка нощ в 2:00
    public void cleanupOldLogs() {
        activityLogService.cleanupOldActivities();
    }
    
    /**
     * Маркира системата като готова след пълно зареждане
     */
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        this.systemReady = true;
        System.out.println("🚀 Admin Activity monitoring system is ready and operational");

        // Изпращаме system message към евентуални свързани админи
        if (activityWebSocketHandler.getActiveSessionsCount() > 0) {
            activityWebSocketHandler.broadcastSystemMessage(
                    "Activity monitoring system started", "info");
        }
    }

    /**
     * Изпраща обновени статистики на всеки 30 секунди
     * Само ако има свързани админи (за да не се прави излишна работа)
     */
    @Scheduled(fixedRate = 30000) // 30 секунди
    public void broadcastStatsUpdate() {
        if (!systemReady) {
            return; // Системата още не е готова
        }

        try {
            int activeConnections = activityWebSocketHandler.getActiveSessionsCount();

            if (activeConnections > 0) {
                activityWebSocketHandler.broadcastStatsUpdate();

            }
        } catch (Exception e) {
            System.err.println("❌ Error in scheduled stats update: " + e.getMessage());
        }
    }

    /**
     * Изпраща ping към всички WebSocket връзки на всеки 60 секунди
     * За да се поддържат връзките активни
     */
    @Scheduled(fixedRate = 60000) // 60 секунди
    public void keepWebSocketsAlive() {
        if (!systemReady) {
            return;
        }

        try {
            int activeConnections = activityWebSocketHandler.getActiveSessionsCount();

            if (activeConnections > 0) {
                activityWebSocketHandler.broadcastSystemMessage("heartbeat", "ping");

            }
        } catch (Exception e) {
            System.err.println("❌ Error in WebSocket heartbeat: " + e.getMessage());
        }
    }

    /**
     * Почиства неактивни WebSocket сесии на всеки 5 минути
     */
    @Scheduled(fixedRate = 300000) // 5 минути
    public void cleanupInactiveWebSocketSessions() {
        if (!systemReady) {
            return;
        }

        try {
            int beforeCount = activityWebSocketHandler.getActiveSessionsCount();
            activityWebSocketHandler.cleanupInactiveSessions();
            int afterCount = activityWebSocketHandler.getActiveSessionsCount();

            if (beforeCount != afterCount) {
                System.out.println("🧹 Cleaned up " + (beforeCount - afterCount) +
                        " inactive WebSocket sessions (" + afterCount + " remaining)");
            }
        } catch (Exception e) {
            System.err.println("❌ Error cleaning up WebSocket sessions: " + e.getMessage());
        }
    }

    /**
     * Ежедневно изчистване на стари активности в 02:00 ч.
     * Изтрива записи по-стари от 30 дни
     */
    @Scheduled(cron = "0 0 2 * * *") // Всеки ден в 2:00 AM
    public void dailyActivityCleanup() {
        if (!systemReady) {
            return;
        }

        try {
            System.out.println("🧹 Starting daily activity logs cleanup at " +
                    LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));

            activityLogService.cleanupOldActivities();

            System.out.println("✅ Daily activity logs cleanup completed successfully");

            // Уведомяваме свързаните админи
            if (activityWebSocketHandler.getActiveSessionsCount() > 0) {
                activityWebSocketHandler.broadcastSystemMessage(
                        "Daily activity logs cleanup completed", "info");
            }

        } catch (Exception e) {
            System.err.println("❌ Error in daily activity cleanup: " + e.getMessage());

            // Уведомяваме админите за грешката
            if (activityWebSocketHandler.getActiveSessionsCount() > 0) {
                activityWebSocketHandler.broadcastSystemMessage(
                        "Error during daily cleanup: " + e.getMessage(), "error");
            }
        }
    }

    /**
     * Седмично подробно статистическо докладване в неделя в 03:00
     */
    @Scheduled(cron = "0 0 3 * * SUN") // Всяка неделя в 3:00 AM
    public void weeklyStatisticsReport() {
        if (!systemReady) {
            return;
        }

        try {


        } catch (Exception e) {
            System.err.println("❌ Error generating weekly statistics: " + e.getMessage());
        }
    }

    /**
     * Мониторинг на системните ресурси на всеки 10 минути
     */
    @Scheduled(fixedRate = 600000) // 10 минути
    public void systemResourceMonitoring() {
        if (!systemReady) {
            return;
        }

        try {
            // Проверяваме за необичайно високa активност
            var stats = activityLogService.getActivityStatistics();
            Object lastHourObj = stats.get("lastHour");
            if (lastHourObj instanceof Number) {
                long lastHourActivities = ((Number) lastHourObj).longValue();

                // Ако има > 500 активности в последния час, уведомяваме
                if (lastHourActivities > 500) {
                    System.out.println("⚠️ High activity detected: " + lastHourActivities +
                            " activities in the last hour");

                    if (activityWebSocketHandler.getActiveSessionsCount() > 0) {
                        activityWebSocketHandler.broadcastSystemMessage(
                                "High activity alert: " + lastHourActivities + " activities in last hour",
                                "warning");
                    }
                }
            }

        } catch (Exception e) {
            System.err.println("❌ Error in system resource monitoring: " + e.getMessage());
        }
    }

    /**
     * Emergency cleanup при изключване на приложението
     */
    @EventListener(ContextClosedEvent.class)
    public void onShutdown(ContextClosedEvent event) {
        try {
            System.out.println("🛑 Activity monitoring system shutdown initiated");

            // Уведомяваме свързаните админи
            if (activityWebSocketHandler.getActiveSessionsCount() > 0) {
                activityWebSocketHandler.broadcastSystemMessage(
                        "System shutdown initiated", "warning");
            }

            // Даваме малко време за изпращане на съобщенията
            Thread.sleep(1000);

        } catch (Exception e) {
            System.err.println("❌ Error during shutdown cleanup: " + e.getMessage());
        }
    }

    // ===== UTILITY METHODS =====

    /**
     * Проверява дали системата е готова за scheduled операции
     */
    public boolean isSystemReady() {
        return systemReady;
    }

    /**
     * Ръчно активиране на statistics broadcast (за тестване)
     */
    public void triggerStatsUpdate() {
        if (systemReady) {
            broadcastStatsUpdate();
        }
    }

    /**
     * Ръчно активиране на cleanup (за тестване)
     */
    public void triggerCleanup() {
        if (systemReady) {
            cleanupInactiveWebSocketSessions();
        }
    }
}