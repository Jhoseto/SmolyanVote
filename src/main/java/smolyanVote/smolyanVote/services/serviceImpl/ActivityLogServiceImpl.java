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
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class ActivityLogServiceImpl implements ActivityLogService {

    private static final int DEFAULT_RETENTION_DAYS = 30;
    private static final int MAX_ACTIVITIES_PER_IP_PER_DAY = 1000;

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
    @Async("activityLogExecutor")
    public void logActivity(ActivityActionEnum action, UserEntity user, String entityType, Long entityId,
                            String details, String ipAddress, String userAgent) {
        try {
            Long userId = user != null ? user.getId() : null;
            String username = user != null ? user.getUsername() : "Anonymous";

            ActivityLogEntity log = new ActivityLogEntity(action.getActionName(), userId, username,
                    entityType, entityId, details, ipAddress, userAgent);

            ActivityLogEntity savedLog = activityLogRepository.save(log);

            // Изпращаме real-time update към админите
            if (activityWebSocketHandler != null) {
                activityWebSocketHandler.broadcastNewActivity(savedLog);
            }

        } catch (Exception e) {
            System.err.println("Failed to log activity: " + e.getMessage());
        }
    }

    @Async("activityLogExecutor")
    @Override
    public void logActivity(ActivityActionEnum action, UserEntity user, String ipAddress, String userAgent) {
        logActivity(action, user, null, null, null, ipAddress, userAgent);
    }

    @Override
    @Async("activityLogExecutor")
    public void logActivity(ActivityActionEnum action, Long userId, String username, String entityType,
                            Long entityId, String details, String ipAddress, String userAgent) {
        try {
            ActivityLogEntity log = new ActivityLogEntity(action.getActionName(), userId, username,
                    entityType, entityId, details, ipAddress, userAgent);

            ActivityLogEntity savedLog = activityLogRepository.save(log);

            // Изпращаме real-time update към админите
            if (activityWebSocketHandler != null) {
                activityWebSocketHandler.broadcastNewActivity(savedLog);
            }

        } catch (Exception e) {
            System.err.println("Failed to log activity: " + e.getMessage());
        }
    }

    @Override
    @Async("activityLogExecutor")
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
                        entityType, entityId, details, ipAddress, userAgent);

                ActivityLogEntity savedLog = activityLogRepository.save(log);

                // Изпращаме real-time update към админите
                if (activityWebSocketHandler != null) {
                    activityWebSocketHandler.broadcastNewActivity(savedLog);
                }

            } catch (Exception e) {
                System.err.println("Failed to log legacy activity: " + e.getMessage());
            }
        }
    }

    // ===== СПЕЦИАЛНИ МЕТОДИ ЗА ГЛАСУВАНИЯ =====

    @Override
    @Async("activityLogExecutor")
    public void logSimpleEventVote(UserEntity user, Long eventId, String voteChoice, String ipAddress, String userAgent) {
        String details = "Vote: " + voteChoice;
        logActivity(ActivityActionEnum.VOTE_SIMPLE_EVENT, user, "SIMPLE_EVENT", eventId, details, ipAddress, userAgent);
    }

    @Override
    @Async("activityLogExecutor")
    public void logReferendumVote(UserEntity user, Long referendumId, String selectedOption, String ipAddress, String userAgent) {
        String details = "Selected: " + selectedOption;
        logActivity(ActivityActionEnum.VOTE_REFERENDUM, user, "REFERENDUM", referendumId, details, ipAddress, userAgent);
    }

    @Override
    @Async("activityLogExecutor")
    public void logMultiPollVote(UserEntity user, Long pollId, List<String> selectedOptions, String ipAddress, String userAgent) {
        String details = "Selected: " + String.join(", ", selectedOptions);
        logActivity(ActivityActionEnum.VOTE_MULTI_POLL, user, "MULTI_POLL", pollId, details, ipAddress, userAgent);
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

            return stats;

        } catch (Exception e) {
            System.err.println("Error generating activity statistics: " + e.getMessage());
            return Collections.emptyMap();
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTopUsers(int limit, LocalDateTime since) {
        List<Object[]> results = activityLogRepository.findMostActiveUsers(since, PageRequest.of(0, limit));

        return results.stream().map(row -> {
            Map<String, Object> user = new HashMap<>();
            user.put("username", row[0]);
            user.put("activityCount", row[1]);
            return user;
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTopActions(LocalDateTime since) {
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
            long activityCount = activityLogRepository.countActivitiesFromIpSince(ipAddress, oneDayAgo);

            return activityCount > MAX_ACTIVITIES_PER_IP_PER_DAY;

        } catch (Exception e) {
            System.err.println("Error checking suspicious IP: " + e.getMessage());
            return false;
        }
    }

    // ===== CLEANUP METHODS =====

    @Override
    @Transactional
    public void cleanupOldActivities() {
        try {
            LocalDateTime cutoffDate = LocalDateTime.now().minusDays(DEFAULT_RETENTION_DAYS);
            long oldCount = activityLogRepository.countByTimestampBefore(cutoffDate);

            if (oldCount > 0) {
                activityLogRepository.deleteByTimestampBefore(cutoffDate);
                System.out.println("🧹 Cleaned up " + oldCount + " old activity logs older than " +
                        DEFAULT_RETENTION_DAYS + " days");
            }
        } catch (Exception e) {
            System.err.println("Error during activity logs cleanup: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public void cleanupOldActivities(int retentionDays) {
        try {
            LocalDateTime cutoffDate = LocalDateTime.now().minusDays(retentionDays);
            long oldCount = activityLogRepository.countByTimestampBefore(cutoffDate);

            if (oldCount > 0) {
                activityLogRepository.deleteByTimestampBefore(cutoffDate);
                System.out.println("🧹 Cleaned up " + oldCount + " old activity logs older than " +
                        retentionDays + " days");
            }
        } catch (Exception e) {
            System.err.println("Error during activity logs cleanup: " + e.getMessage());
        }
    }
}