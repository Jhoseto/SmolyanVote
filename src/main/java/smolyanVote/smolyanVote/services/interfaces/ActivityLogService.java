package smolyanVote.smolyanVote.services.interfaces;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.ActivityLogEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.ActivityActionEnum;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public interface ActivityLogService {

    // ===== CORE LOGGING METHODS =====

    /**
     * Записва активност в системата
     */
    void logActivity(ActivityActionEnum action, UserEntity user, String entityType, Long entityId,
                     String details, String ipAddress, String userAgent);


    @Async("activityLogExecutor")
    void logActivity(ActivityActionEnum action, UserEntity user, String ipAddress, String userAgent);

    /**
     * Записва активност с допълнителни детайли
     */
    void logActivity(ActivityActionEnum action, Long userId, String username, String entityType,
                     Long entityId, String details, String ipAddress, String userAgent);

    /**
     * Legacy метод за записване с String action (за backward compatibility)
     */
    void logActivity(String action, UserEntity user, String entityType, Long entityId,
                     String details, String ipAddress, String userAgent);

    // ===== СПЕЦИАЛНИ МЕТОДИ ЗА ГЛАСУВАНИЯ =====

    /**
     * Записва гласуване в простo събитие (За/Против/Неутрален)
     */
    void logSimpleEventVote(UserEntity user, Long eventId, String voteChoice, String ipAddress, String userAgent);

    /**
     * Записва гласуване в референдум
     */
    void logReferendumVote(UserEntity user, Long referendumId, String selectedOption, String ipAddress, String userAgent);

    /**
     * Записва гласуване в анкета с множествен избор
     */
    void logMultiPollVote(UserEntity user, Long pollId, List<String> selectedOptions, String ipAddress, String userAgent);

    // ===== RETRIEVAL METHODS =====

    /**
     * Връща последните активности (за админ dashboard)
     */
    List<ActivityLogEntity> getRecentActivities(int limit);

    /**
     * Връща активности след определено ID (за real-time updates)
     */
    List<ActivityLogEntity> getActivitiesSinceId(Long lastId);

    /**
     * Връща активности с филтриране и пагинация
     */
    Page<ActivityLogEntity> getActivitiesWithFilters(String action, String username,
                                                     String entityType, LocalDateTime since,
                                                     Pageable pageable);

    /**
     * Връща всички активности за конкретен entity
     */
    List<ActivityLogEntity> getActivitiesForEntity(String entityType, Long entityId);

    /**
     * Връща активности за потребител
     */
    Page<ActivityLogEntity> getActivitiesForUser(Long userId, Pageable pageable);

    // ===== STATISTICS METHODS =====

    /**
     * Връща статистики за админ dashboard
     */
    Map<String, Object> getActivityStatistics();

    @Transactional(readOnly = true)
    List<Map<String, Object>> getTopUsers(int limit, LocalDateTime since);

    @Transactional(readOnly = true)
    List<Map<String, Object>> getTopActions(LocalDateTime since);

    /**
     * Връща приблизителен брой онлайн потребители
     */
    long getEstimatedOnlineUsers();

    // ===== IP TRACKING METHODS =====

    /**
     * Връща всички IP адреси за потребител
     */
    List<String> getUserIpAddresses(Long userId);

    /**
     * Връща активности от конкретен IP
     */
    List<ActivityLogEntity> getActivitiesFromIp(String ipAddress);

    /**
     * Проверява дали IP адресът е подозрителен
     */
    boolean isSuspiciousIp(String ipAddress);

    // ===== MAINTENANCE METHODS =====

    @Transactional
    void cleanupOldActivities();

    /**
     * Изчиства стари активности (старши от X дни)
     */
    void cleanupOldActivities(int daysToKeep);

}