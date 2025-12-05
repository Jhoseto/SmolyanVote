package smolyanVote.smolyanVote.services.serviceImpl;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.UserFollowEntity;
import smolyanVote.smolyanVote.models.enums.ActivityActionEnum;
import smolyanVote.smolyanVote.models.enums.ActivityTypeEnum;
import smolyanVote.smolyanVote.repositories.UserFollowRepository;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.interfaces.ActivityLogService;
import smolyanVote.smolyanVote.services.interfaces.FollowService;
import smolyanVote.smolyanVote.services.interfaces.NotificationService;

import java.util.ArrayList;
import java.util.List;

/**
 * Implementation на FollowService
 * Оптимизирано за високи performance заявки
 */
@Service
public class FollowServiceImpl implements FollowService {


    private final UserFollowRepository userFollowRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final ActivityLogService activityLogService;

    @Autowired
    public FollowServiceImpl(UserFollowRepository userFollowRepository,
                             UserRepository userRepository, NotificationService notificationService,
                             ActivityLogService activityLogService) {
        this.userFollowRepository = userFollowRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.activityLogService = activityLogService;
    }

    @Override
    @Transactional
    public void followUser(Long followerId, Long followingId) {
        // Validation
        if (followerId == null || followingId == null) {
            throw new IllegalArgumentException("ID-тата не могат да бъдат null");
        }

        if (followerId.equals(followingId)) {
            throw new IllegalArgumentException("Не можете да следвате себе си");
        }

        if (isFollowing(followerId, followingId)) {
            throw new IllegalArgumentException("Вече следвате този потребител");
        }

        // Fetch users - проверяваме дали съществуват
        UserEntity follower = userRepository.findById(followerId)
                .orElseThrow(() -> new IllegalArgumentException("Потребителят който следва не съществува"));
        UserEntity following = userRepository.findById(followingId)
                .orElseThrow(() -> new IllegalArgumentException("Потребителят който се следва не съществува"));

        // Create follow relationship
        UserFollowEntity followEntity = new UserFollowEntity(follower, following);
        userFollowRepository.save(followEntity);

        // ✅НОТИФИКАЦИЯ
        notificationService.notifyNewFollower(following, follower);

        // ✅ ЛОГИРАНЕ НА АКТИВНОСТ
        try {
            String ipAddress = extractIpAddress();
            String userAgent = extractUserAgent();
            String details = String.format("Followed user: %s (ID: %d)", following.getUsername(), following.getId());
            activityLogService.logActivity(ActivityActionEnum.FOLLOW_USER, follower,
                    ActivityTypeEnum.USER.name(), following.getId(), details, ipAddress, userAgent);
        } catch (Exception e) {
            System.err.println("Failed to log follow activity: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public void unfollowUser(Long followerId, Long followingId) {
        // Validation
        if (followerId == null || followingId == null) {
            throw new IllegalArgumentException("ID-тата не могат да бъдат null");
        }

        if (!isFollowing(followerId, followingId)) {
            throw new IllegalArgumentException("Не следвате този потребител");
        }

        // ✅  Fetch users за нотификацията
        UserEntity follower = userRepository.findById(followerId)
                .orElseThrow(() -> new IllegalArgumentException("Потребителят не съществува"));
        UserEntity following = userRepository.findById(followingId)
                .orElseThrow(() -> new IllegalArgumentException("Потребителят не съществува"));

        // Bulk delete - най-бързо
        userFollowRepository.deleteByFollowerIdAndFollowingId(followerId, followingId);

        // ✅ НОТИФИКАЦИЯ
        notificationService.notifyUnfollow(following, follower);

        // ✅ ЛОГИРАНЕ НА АКТИВНОСТ
        try {
            String ipAddress = extractIpAddress();
            String userAgent = extractUserAgent();
            String details = String.format("Unfollowed user: %s (ID: %d)", following.getUsername(), following.getId());
            activityLogService.logActivity(ActivityActionEnum.UNFOLLOW_USER, follower,
                    ActivityTypeEnum.USER.name(), following.getId(), details, ipAddress, userAgent);
        } catch (Exception e) {
            System.err.println("Failed to log unfollow activity: " + e.getMessage());
        }
    }


    @Override
    public boolean isFollowing(Long followerId, Long followingId) {
        if (followerId == null || followingId == null || followerId.equals(followingId)) {
            return false;
        }
        long count = userFollowRepository.existsByFollowerIdAndFollowingIdRaw(followerId, followingId);
        return count > 0;
    }


    @Override
    public long getFollowersCount(Long userId) {
        if (userId == null) {
            return 0;
        }

        return userFollowRepository.countByFollowingId(userId);
    }

    @Override
    public long getFollowingCount(Long userId) {
        if (userId == null) {
            return 0;
        }

        return userFollowRepository.countByFollowerId(userId);
    }


    @Override
    public List<Object[]> getFollowers(Long userId, int page, int size) {
        if (userId == null) {
            return new ArrayList<>();
        }

        int offset = page * size;
        return userFollowRepository.findFollowersWithPagination(userId, offset, size);
    }

    @Override
    public List<Object[]> getFollowing(Long userId, int page, int size) {
        if (userId == null) {
            return new ArrayList<>();
        }

        int offset = page * size;
        return userFollowRepository.findFollowingWithPagination(userId, offset, size);
    }

    @Override
    public List<Object[]> searchFollowers(Long userId, String searchTerm, int page, int size) {
        if (userId == null || searchTerm == null || searchTerm.trim().isEmpty()) {
            return getFollowers(userId, page, size);
        }

        int offset = page * size;
        return userFollowRepository.searchFollowers(userId, searchTerm.trim(), offset, size);
    }

    @Override
    public List<Object[]> searchFollowing(Long userId, String searchTerm, int page, int size) {
        if (userId == null || searchTerm == null || searchTerm.trim().isEmpty()) {
            return getFollowing(userId, page, size);
        }

        int offset = page * size;
        return userFollowRepository.searchFollowing(userId, searchTerm.trim(), offset, size);
    }

    // ===== HELPER METHODS FOR ACTIVITY LOGGING =====

    private String extractIpAddress() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                if (request != null) {
                    String ip = request.getHeader("X-Forwarded-For");
                    if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
                        ip = request.getHeader("X-Real-IP");
                    }
                    if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
                        ip = request.getRemoteAddr();
                    }
                    if (ip != null && ip.contains(",")) {
                        ip = ip.split(",")[0].trim();
                    }
                    return ip != null ? ip : "unknown";
                }
            }
        } catch (Exception e) {
            // Ignore
        }
        return "unknown";
    }

    private String extractUserAgent() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                if (request != null) {
                    String userAgent = request.getHeader("User-Agent");
                    return userAgent != null ? userAgent : "unknown";
                }
            }
        } catch (Exception e) {
            // Ignore
        }
        return "unknown";
    }
}