package smolyanVote.smolyanVote.services.interfaces;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import smolyanVote.smolyanVote.models.ActivityLogEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.ActivityActionEnum;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public interface ActivityLogService {

    // ===== CORE LOGGING METHODS =====

    void logActivity(ActivityActionEnum action, UserEntity user, String entityType, Long entityId,
                     String details, String ipAddress, String userAgent);

    void logActivity(ActivityActionEnum action, UserEntity user, String ipAddress, String userAgent);

    void logActivity(ActivityActionEnum action, Long userId, String username, String entityType,
                     Long entityId, String details, String ipAddress, String userAgent);

    void logActivity(String action, UserEntity user, String entityType, Long entityId,
                     String details, String ipAddress, String userAgent);

    // ===== VOTING TRACKING =====

    void logSimpleEventVote(UserEntity user, Long eventId, String voteChoice, String ipAddress, String userAgent);

    void logReferendumVote(UserEntity user, Long referendumId, String selectedOption, String ipAddress, String userAgent);

    void logMultiPollVote(UserEntity user, Long pollId, List<String> selectedOptions, String ipAddress, String userAgent);

    // ===== ACTIVITY WALL =====

    List<ActivityLogEntity> getRecentActivities(int limit);

    List<ActivityLogEntity> getActivitiesSinceId(Long lastId);

    Map<String, Object> getActivityStatistics();

    // ===== SEARCH & FILTERING =====

    Page<ActivityLogEntity> getActivitiesWithFilters(String action, String username,
                                                     String entityType, LocalDateTime since,
                                                     Pageable pageable);
    List<ActivityLogEntity> getActivitiesForEntity(String entityType, Long entityId);

    Page<ActivityLogEntity> getActivitiesForUser(Long userId, Pageable pageable);

    List<Map<String, Object>> getTopUsers(int limit, LocalDateTime since);

    List<Map<String, Object>> getTopActions(LocalDateTime since);

    long getEstimatedOnlineUsers();

    // ===== IP TRACKING =====

    List<String> getUserIpAddresses(Long userId);

    List<ActivityLogEntity> getActivitiesFromIp(String ipAddress);

    boolean isSuspiciousIp(String ipAddress);

    // ===== SCHEDULER SUPPORT =====

    long getWeekActivitiesCount();

    long getLastHourActivitiesCount();

    // ===== MAINTENANCE =====

    void cleanupOldActivities();

    void cleanupOldActivities(int retentionDays);
}