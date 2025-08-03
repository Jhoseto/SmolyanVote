package smolyanVote.smolyanVote.services.serviceImpl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.config.websocket.ActivityWebSocketHandler;
import smolyanVote.smolyanVote.models.ActivityLogEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.ActivityActionEnum;
import smolyanVote.smolyanVote.repositories.ActivityLogRepository;
import smolyanVote.smolyanVote.services.interfaces.ActivityLogService;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class ActivityLogServiceImpl implements ActivityLogService {

    private static final int DEFAULT_RETENTION_DAYS = 30;

    private final ActivityLogRepository activityLogRepository;
    private final ActivityWebSocketHandler activityWebSocketHandler;

    @Autowired
    public ActivityLogServiceImpl(ActivityLogRepository activityLogRepository,
                                  ActivityWebSocketHandler activityWebSocketHandler) {
        this.activityLogRepository = activityLogRepository;
        this.activityWebSocketHandler = activityWebSocketHandler;
    }

    // ===== CORE LOGGING METHODS =====

    @Override
    @Async
    public void logActivity(ActivityActionEnum action, UserEntity user, String entityType, Long entityId,
                            String details, String ipAddress, String userAgent) {
        try {
            Long userId = user != null ? user.getId() : null;
            String username = user != null ? user.getUsername() : "Anonymous";
            String actionString = action.getActionName();

            ActivityLogEntity log = new ActivityLogEntity(actionString, userId, username,
                    entityType, entityId, details,
                    ipAddress, userAgent);
            activityLogRepository.save(log);
        } catch (Exception e) {
            // Log error но не спираме основната операция
            System.err.println("Failed to log activity: " + e.getMessage());
        }
    }

    // ===== СПЕЦИАЛНИ МЕТОДИ ЗА ГЛАСУВАНИЯ =====

    @Override
    @Async
    public void logSimpleEventVote(UserEntity user, Long eventId, String voteChoice, String ipAddress, String userAgent) {
        try {
            String details = "Гласува: " + voteChoice;
            logActivity(ActivityActionEnum.VOTE_SIMPLE_EVENT, user, "SIMPLE_EVENT", eventId,
                    details, ipAddress, userAgent);
        } catch (Exception e) {
            System.err.println("Failed to log simple event vote: " + e.getMessage());
        }
    }

    @Override
    @Async
    public void logReferendumVote(UserEntity user, Long referendumId, String selectedOption, String ipAddress, String userAgent) {
        try {
            String details = "Избра опция: '" + selectedOption + "'";
            logActivity(ActivityActionEnum.VOTE_REFERENDUM, user, "REFERENDUM", referendumId,
                    details, ipAddress, userAgent);
        } catch (Exception e) {
            System.err.println("Failed to log referendum vote: " + e.getMessage());
        }
    }

    @Override
    @Async
    public void logMultiPollVote(UserEntity user, Long pollId, List<String> selectedOptions, String ipAddress, String userAgent) {
        try {
            String optionsText = String.join("', '", selectedOptions);
            String details = "Избра опции: '" + optionsText + "'";
            logActivity(ActivityActionEnum.VOTE_MULTI_POLL, user, "MULTI_POLL", pollId,
                    details, ipAddress, userAgent);
        } catch (Exception e) {
            System.err.println("Failed to log multi poll vote: " + e.getMessage());
        }
    }

    @Override
    @Async
    public void logActivity(ActivityActionEnum action, UserEntity user, String ipAddress, String userAgent) {
        logActivity(action, user, null, null, null, ipAddress, userAgent);
    }

    @Override
    @Async
    public void logActivity(ActivityActionEnum action, Long userId, String username, String entityType,
                            Long entityId, String details, String ipAddress, String userAgent) {
        try {
            String actionString = action.getActionName();
            ActivityLogEntity log = new ActivityLogEntity(actionString, userId, username,
                    entityType, entityId, details,
                    ipAddress, userAgent);
            activityLogRepository.save(log);
        } catch (Exception e) {
            System.err.println("Failed to log activity: " + e.getMessage());
        }
    }

    @Override
    @Async
    public void logActivity(String action, UserEntity user, String entityType, Long entityId,
                            String details, String ipAddress, String userAgent) {
        // Legacy метод - конвертираме String към enum ако е възможно
        ActivityActionEnum actionEnum = ActivityActionEnum.fromString(action);
        if (actionEnum != null) {
            logActivity(actionEnum, user, entityType, entityId, details, ipAddress, userAgent);
        } else {
            // Fallback към директно записване на String-а
            try {
                Long userId = user != null ? user.getId() : null;
                String username = user != null ? user.getUsername() : "Anonymous";

                ActivityLogEntity log = new ActivityLogEntity(action, userId, username,
                        entityType, entityId, details,
                        ipAddress, userAgent);
                activityLogRepository.save(log);
            } catch (Exception e) {
                System.err.println("Failed to log activity: " + e.getMessage());
            }
        }
    }

    // ===== RETRIEVAL METHODS =====

    @Override
    @Transactional(readOnly = true)
    public List<ActivityLogEntity> getRecentActivities(int limit) {
        limit = Math.min(Math.max(1, limit), 1000); // Ограничаваме между 1 и 1000
        return activityLogRepository.findTop100ByOrderByTimestampDesc()
                .stream()
                .limit(limit)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ActivityLogEntity> getActivitiesSinceId(Long lastId) {
        if (lastId == null || lastId <= 0) {
            return getRecentActivities(50);
        }
        return activityLogRepository.findActivitiesSinceId(lastId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ActivityLogEntity> getActivitiesWithFilters(String action, String username,
                                                            String entityType, LocalDateTime since,
                                                            Pageable pageable) {
        try {
            // За сега имплементираме базово филтриране
            // По-късно можем да добавим custom query с всички филтри

            if (action != null && !action.trim().isEmpty()) {
                return activityLogRepository.findByActionOrderByTimestampDesc(action, pageable);
            }

            if (username != null && !username.trim().isEmpty()) {
                return activityLogRepository.findByUsernameContainingIgnoreCaseOrderByTimestampDesc(username, pageable);
            }

            if (entityType != null && !entityType.trim().isEmpty()) {
                return activityLogRepository.findByEntityTypeOrderByTimestampDesc(entityType, pageable);
            }

            // Ако няма филтри, връщаме всички
            return activityLogRepository.findAll(pageable);

        } catch (Exception e) {
            System.err.println("Error filtering activities: " + e.getMessage());
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<ActivityLogEntity> getActivitiesForEntity(String entityType, Long entityId) {
        return activityLogRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc(entityType, entityId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ActivityLogEntity> getActivitiesForUser(Long userId, Pageable pageable) {
        return activityLogRepository.findByUserIdOrderByTimestampDesc(userId, pageable);
    }

    // ===== STATISTICS METHODS =====

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getActivityStatistics() {
        Map<String, Object> stats = new HashMap<>();

        try {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime oneHourAgo = now.minusHours(1);
            LocalDateTime oneDayAgo = now.minusDays(1);

            // Основни статистики
            stats.put("lastHour", activityLogRepository.countActivitiesSince(oneHourAgo));
            stats.put("today", activityLogRepository.countActivitiesSince(oneDayAgo));
            stats.put("onlineUsers", getEstimatedOnlineUsers());

            // Най-активни потребители за последните 24ч
            List<Object[]> activeUsers = activityLogRepository.findMostActiveUsers(
                    oneDayAgo, PageRequest.of(0, 5));
            List<Map<String, Object>> topUsers = new ArrayList<>();
            for (Object[] row : activeUsers) {
                Map<String, Object> user = new HashMap<>();
                user.put("username", row[0]);
                user.put("activityCount", row[1]);
                topUsers.add(user);
            }
            stats.put("topUsers", topUsers);

            // Най-чести действия
            List<Object[]> frequentActions = activityLogRepository.findMostFrequentActions(oneDayAgo);
            List<Map<String, Object>> topActions = new ArrayList<>();
            for (Object[] row : frequentActions) {
                Map<String, Object> action = new HashMap<>();
                action.put("action", row[0]);
                action.put("count", row[1]);
                topActions.add(action);
            }
            stats.put("topActions", topActions);

        } catch (Exception e) {
            System.err.println("Error getting activity statistics: " + e.getMessage());
            // Fallback стойности
            stats.put("lastHour", 0);
            stats.put("today", 0);
            stats.put("onlineUsers", 0);
            stats.put("topUsers", Collections.emptyList());
            stats.put("topActions", Collections.emptyList());
        }

        return stats;
    }

    @Override
    @Transactional(readOnly = true)
    public long getLastHourActivitiesCount() {
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        return activityLogRepository.countActivitiesSince(oneHourAgo);
    }

    @Override
    @Transactional(readOnly = true)
    public long getTodayActivitiesCount() {
        LocalDateTime oneDayAgo = LocalDateTime.now().minusDays(1);
        return activityLogRepository.countActivitiesSince(oneDayAgo);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getMostActiveUsers(int hours, int limit) {
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        List<Object[]> results = activityLogRepository.findMostActiveUsers(
                since, PageRequest.of(0, limit));

        return results.stream().map(row -> {
            Map<String, Object> user = new HashMap<>();
            user.put("username", row[0]);
            user.put("activityCount", row[1]);
            return user;
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getMostFrequentActions(int hours) {
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        List<Object[]> results = activityLogRepository.findMostFrequentActions(since);

        return results.stream().map(row -> {
            Map<String, Object> action = new HashMap<>();
            action.put("action", row[0]);
            action.put("count", row[1]);
            return action;
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public long getEstimatedOnlineUsers() {
        // Считаме за "онлайн" потребителите с активност в последните 15 минути
        LocalDateTime fifteenMinutesAgo = LocalDateTime.now().minusMinutes(15);

        try {
            List<ActivityLogEntity> recentActivities = activityLogRepository.findRecentActivities(fifteenMinutesAgo);

            // Броим уникалните потребители
            Set<Long> uniqueUsers = recentActivities.stream()
                    .filter(activity -> activity.getUserId() != null)
                    .map(ActivityLogEntity::getUserId)
                    .collect(Collectors.toSet());

            return uniqueUsers.size();
        } catch (Exception e) {
            System.err.println("Error estimating online users: " + e.getMessage());
            return 0;
        }
    }

    // ===== IP TRACKING METHODS =====

    @Override
    @Transactional(readOnly = true)
    public List<String> getUserIpAddresses(Long userId) {
        return activityLogRepository.findDistinctIpAddressesByUserId(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ActivityLogEntity> getActivitiesFromIp(String ipAddress) {
        return activityLogRepository.findByIpAddressOrderByTimestampDesc(ipAddress);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isSuspiciousIp(String ipAddress) {
        if (ipAddress == null || ipAddress.trim().isEmpty()) {
            return false;
        }

        try {
            // Проверяваме дали има твърде много активности от този IP за последните 24ч
            LocalDateTime oneDayAgo = LocalDateTime.now().minusDays(1);
            List<ActivityLogEntity> activities = activityLogRepository.findByIpAddressOrderByTimestampDesc(ipAddress);

            long recentActivities = activities.stream()
                    .filter(activity -> activity.getTimestamp().isAfter(oneDayAgo))
                    .count();

            // Ако има повече от 1000 активности за 24ч от един IP - подозрително
            return recentActivities > 1000;

        } catch (Exception e) {
            System.err.println("Error checking suspicious IP: " + e.getMessage());
            return false;
        }
    }

    // ===== MAINTENANCE METHODS =====

    @Override
    @Transactional
    public long cleanupOldActivities(int daysToKeep) {
        try {
            // Ако не е подадено, използваме default-ната стойност
            if (daysToKeep <= 0) {
                daysToKeep = DEFAULT_RETENTION_DAYS;
            }

            LocalDateTime cutoffDate = LocalDateTime.now().minusDays(daysToKeep);

            // Първо проверяваме колко записа ще изтрием
            long countToDelete = activityLogRepository.countActivitiesBefore(cutoffDate);

            if (countToDelete > 0) {
                activityLogRepository.deleteActivitiesBefore(cutoffDate);
                System.out.println("Cleaned up " + countToDelete + " old activity logs older than " + daysToKeep + " days");

                // ✅ Изпращаме система съобщение към админите за cleanup
                broadcastSystemMessage("Изтрити са " + countToDelete + " стари логове (по-стари от " + daysToKeep + " дни)", "info");

                // ✅ Обновяваме статистиките след cleanup
                broadcastStatsUpdate();
            }

            return countToDelete;

        } catch (Exception e) {
            System.err.println("Error during cleanup: " + e.getMessage());
            broadcastSystemMessage("Грешка при изчистване на стари логове: " + e.getMessage(), "error");
            return 0;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getTableStatistics() {
        Map<String, Object> stats = new HashMap<>();

        try {
            long totalRecords = activityLogRepository.count();

            LocalDateTime now = LocalDateTime.now();
            LocalDateTime oneWeekAgo = now.minusWeeks(1);
            LocalDateTime oneMonthAgo = now.minusMonths(1);

            long lastWeekRecords = activityLogRepository.countActivitiesSince(oneWeekAgo);
            long lastMonthRecords = activityLogRepository.countActivitiesSince(oneMonthAgo);

            stats.put("totalRecords", totalRecords);
            stats.put("lastWeekRecords", lastWeekRecords);
            stats.put("lastMonthRecords", lastMonthRecords);
            stats.put("estimatedSizeGB", calculateEstimatedSize(totalRecords));

        } catch (Exception e) {
            System.err.println("Error getting table statistics: " + e.getMessage());
            stats.put("totalRecords", 0);
            stats.put("lastWeekRecords", 0);
            stats.put("lastMonthRecords", 0);
            stats.put("estimatedSizeGB", 0.0);
        }

        return stats;
    }

    @Override
    @Transactional(readOnly = true)
    public String exportActivitiesToCsv(LocalDateTime from, LocalDateTime to) {
        try {
            List<ActivityLogEntity> activities = activityLogRepository.findRecentActivities(from);

            // Филтрираме по период
            activities = activities.stream()
                    .filter(activity -> activity.getTimestamp().isAfter(from) &&
                            activity.getTimestamp().isBefore(to))
                    .collect(Collectors.toList());

            StringBuilder csv = new StringBuilder();
            csv.append("Timestamp,User,Action,Entity Type,Entity ID,Details,IP Address\n");

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

            for (ActivityLogEntity activity : activities) {
                csv.append("\"").append(activity.getTimestamp().format(formatter)).append("\",");
                csv.append("\"").append(escapeCSV(activity.getUsername())).append("\",");
                csv.append("\"").append(escapeCSV(activity.getAction())).append("\",");
                csv.append("\"").append(escapeCSV(activity.getEntityType())).append("\",");
                csv.append("\"").append(activity.getEntityId() != null ? activity.getEntityId() : "").append("\",");
                csv.append("\"").append(escapeCSV(activity.getDetails())).append("\",");
                csv.append("\"").append(escapeCSV(activity.getIpAddress())).append("\"");
                csv.append("\n");
            }

            return csv.toString();

        } catch (Exception e) {
            System.err.println("Error exporting to CSV: " + e.getMessage());
            return "Error,Error,Error,Error,Error,Error,Error\n";
        }
    }

    // ===== HELPER METHODS =====

    private double calculateEstimatedSize(long recordCount) {
        // Приблизително 500 bytes на запис (с индекси)
        double bytesPerRecord = 500.0;
        double totalBytes = recordCount * bytesPerRecord;
        return totalBytes / (1024.0 * 1024.0 * 1024.0); // GB
    }

    private String escapeCSV(String value) {
        if (value == null) return "";
        return value.replace("\"", "\"\"");
    }
}