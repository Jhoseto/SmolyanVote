package smolyanVote.smolyanVote.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import smolyanVote.smolyanVote.config.websocket.ActivityWebSocketHandler;
import smolyanVote.smolyanVote.services.interfaces.ActivityLogService;

/**
 * Scheduled tasks за Activity Wall система
 * Периодично изпраща статистики и поддържа WebSocket връзките
 */
@Component
public class ActivityStatsScheduler {

    private final ActivityLogService activityLogService;
    private final ActivityWebSocketHandler activityWebSocketHandler;

    @Autowired
    public ActivityStatsScheduler(ActivityLogService activityLogService,
                                  ActivityWebSocketHandler activityWebSocketHandler) {
        this.activityLogService = activityLogService;
        this.activityWebSocketHandler = activityWebSocketHandler;
    }

    /**
     * Изпраща обновени статистики на всеки 30 секунди
     * Само ако има свързани админи (за да не се прави излишна работа)
     */
    @Scheduled(fixedRate = 30000) // 30 секунди
    public void broadcastStatsUpdate() {
        try {
            if (activityWebSocketHandler.getActiveSessionsCount() > 0) {
                activityWebSocketHandler.broadcastStatsUpdate();

                // Debug log само когато има свързани админи
                System.out.println("📊 Stats update sent to " +
                        activityWebSocketHandler.getActiveSessionsCount() + " admin(s)");
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
        try {
            if (activityWebSocketHandler.getActiveSessionsCount() > 0) {
                activityWebSocketHandler.broadcastSystemMessage("Heartbeat", "ping");

                System.out.println("💓 Heartbeat sent to " +
                        activityWebSocketHandler.getActiveSessionsCount() + " WebSocket connection(s)");
            }
        } catch (Exception e) {
            System.err.println("❌ Error in WebSocket heartbeat: " + e.getMessage());
        }
    }

    /**
     * Ежедневно изчистване на стари активности в 02:00 ч.
     * Използва default retention period (30 дни)
     */
    @Scheduled(cron = "0 0 2 * * *") // Всеки ден в 02:00
    public void dailyCleanup() {
        try {
            System.out.println("🧹 Starting daily activity logs cleanup...");

            long deletedCount = activityLogService.cleanupOldActivities(30);

            if (deletedCount > 0) {
                System.out.println("✅ Daily cleanup completed: " + deletedCount + " old logs removed");
            } else {
                System.out.println("✅ Daily cleanup completed: No old logs to remove");
            }

        } catch (Exception e) {
            System.err.println("❌ Error in daily cleanup: " + e.getMessage());

            // Изпращаме error съобщение към админите
            try {
                activityWebSocketHandler.broadcastSystemMessage(
                        "Грешка при ежедневното изчистване: " + e.getMessage(), "error");
            } catch (Exception broadcastError) {
                System.err.println("❌ Failed to broadcast cleanup error: " + broadcastError.getMessage());
            }
        }
    }

    /**
     * Седмично изпращане на статистики по имейл (бъдеща функционалност)
     * Всяка неделя в 08:00 ч.
     */
    @Scheduled(cron = "0 0 8 * * SUN") // Всяка неделя в 08:00
    public void weeklyStatsReport() {
        try {
            System.out.println("📈 Generating weekly activity stats report...");

            // TODO: Implement weekly email report
            // Това може да се имплементира по-късно с EmailService

            // Засега само изпращаме съобщение към админите
            activityWebSocketHandler.broadcastSystemMessage(
                    "Седмичен отчет: Повече от " + activityLogService.getWeekActivitiesCount() + " активности", "info");

        } catch (Exception e) {
            System.err.println("❌ Error generating weekly report: " + e.getMessage());
        }
    }

    /**
     * Проверка за подозрителна активност на всеки 15 минути
     */
    @Scheduled(fixedRate = 900000) // 15 минути
    public void suspiciousActivityCheck() {
        try {
            // TODO: Implement suspicious activity detection
            // Примери за suspicious activity:
            // - Твърде много активности от един IP
            // - Необичайни patterns в гласуванията
            // - Много бързо създаване на съдържание

            System.out.println("🔍 Suspicious activity check completed");

        } catch (Exception e) {
            System.err.println("❌ Error in suspicious activity check: " + e.getMessage());
        }
    }

    /**
     * Performance мониторинг на всеки час
     */
    @Scheduled(fixedRate = 3600000) // 60 минути
    public void performanceMonitoring() {
        try {
            System.out.println("⚡ Activity Wall performance check:");
            System.out.println("   - Active WebSocket connections: " +
                    activityWebSocketHandler.getActiveSessionsCount());
            System.out.println("   - Last hour activities: " +
                    activityLogService.getLastHourActivitiesCount());
            System.out.println("   - Estimated online users: " +
                    activityLogService.getEstimatedOnlineUsers());

            // Ако има свързани админи, изпращаме performance update
            if (activityWebSocketHandler.getActiveSessionsCount() > 0) {
                activityWebSocketHandler.broadcastSystemMessage(
                        "Performance check: " + activityLogService.getLastHourActivitiesCount() +
                                " активности за последния час", "info");
            }

        } catch (Exception e) {
            System.err.println("❌ Error in performance monitoring: " + e.getMessage());
        }
    }
}