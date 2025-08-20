package smolyanVote.smolyanVote.services.serviceImpl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.UserRole;
import smolyanVote.smolyanVote.models.enums.UserStatusEnum;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.interfaces.AdminUserManagementService;
import smolyanVote.smolyanVote.services.interfaces.UserService;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@Transactional
public class AdminUserManagementServiceImpl implements AdminUserManagementService {

    private final UserRepository userRepository;
    private final UserService userService;

    @Autowired
    public AdminUserManagementServiceImpl(UserRepository userRepository, UserService userService) {
        this.userRepository = userRepository;
        this.userService = userService;
    }

    // ===== USER RETRIEVAL =====

    @Override
    @Transactional(readOnly = true)
    public List<UserEntity> getAllUsers() {
        return userRepository.findAllUsersForAdminDashboard();
    }

    @Override
    @Transactional(readOnly = true)
    public UserEntity getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Потребителят не е намерен"));
    }

    // ===== USER STATISTICS =====

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getUserStatistics() {
        List<UserEntity> allUsers = userRepository.findAll();
        Map<String, Object> stats = new HashMap<>();

        // Общо потребители
        long totalUsers = allUsers.size();

        // Status distribution
        long activeUsers = allUsers.stream()
                .mapToLong(u -> UserStatusEnum.ACTIVE.equals(u.getStatus()) ? 1 : 0).sum();
        long pendingUsers = allUsers.stream()
                .mapToLong(u -> UserStatusEnum.PENDING_ACTIVATION.equals(u.getStatus()) ? 1 : 0).sum();
        long tempBannedUsers = allUsers.stream()
                .mapToLong(u -> UserStatusEnum.TEMPORARILY_BANNED.equals(u.getStatus()) ? 1 : 0).sum();
        long permBannedUsers = allUsers.stream()
                .mapToLong(u -> UserStatusEnum.PERMANENTLY_BANNED.equals(u.getStatus()) ? 1 : 0).sum();

        // Online потребители (активни в последните 5 минути)
        Instant fiveMinutesAgo = Instant.now().minus(5, ChronoUnit.MINUTES);
        long onlineUsers = allUsers.stream()
                .mapToLong(u -> (u.getOnlineStatus() == 1 && u.getLastOnline() != null &&
                        u.getLastOnline().isAfter(fiveMinutesAgo)) ? 1 : 0).sum();

        // Role distribution
        long adminCount = allUsers.stream()
                .mapToLong(u -> UserRole.ADMIN.equals(u.getRole()) ? 1 : 0).sum();
        long userCount = allUsers.stream()
                .mapToLong(u -> UserRole.USER.equals(u.getRole()) ? 1 : 0).sum();

        // Registration stats
        Instant todayStart = Instant.now().truncatedTo(ChronoUnit.DAYS);
        Instant weekStart = todayStart.minus(7, ChronoUnit.DAYS);
        Instant monthStart = todayStart.minus(30, ChronoUnit.DAYS);

        long todayRegistrations = allUsers.stream()
                .mapToLong(u -> u.getCreated().isAfter(todayStart) ? 1 : 0).sum();
        long weekRegistrations = allUsers.stream()
                .mapToLong(u -> u.getCreated().isAfter(weekStart) ? 1 : 0).sum();
        long monthRegistrations = allUsers.stream()
                .mapToLong(u -> u.getCreated().isAfter(monthStart) ? 1 : 0).sum();

        // Engagement metrics
        double avgEngagement = allUsers.stream()
                .mapToDouble(u -> u.getUserEventsCount() + u.getPublicationsCount() + u.getTotalVotes())
                .average().orElse(0.0);

        long highActivityUsers = allUsers.stream()
                .mapToLong(u -> (u.getUserEventsCount() + u.getPublicationsCount() > 5) ? 1 : 0).sum();

        // Build response
        stats.put("totalUsers", totalUsers);
        stats.put("activeUsers", activeUsers);
        stats.put("pendingUsers", pendingUsers);
        stats.put("tempBannedUsers", tempBannedUsers);
        stats.put("permBannedUsers", permBannedUsers);
        stats.put("onlineUsers", onlineUsers);
        stats.put("adminCount", adminCount);
        stats.put("userCount", userCount);
        stats.put("todayRegistrations", todayRegistrations);
        stats.put("weekRegistrations", weekRegistrations);
        stats.put("monthRegistrations", monthRegistrations);
        stats.put("avgEngagement", Math.round(avgEngagement * 100.0) / 100.0);
        stats.put("highActivityUsers", highActivityUsers);
        stats.put("timestamp", Instant.now());

        return stats;
    }

    // ===== ROLE MANAGEMENT =====

    @Override
    public void promoteUserToAdmin(Long userId) {
        UserEntity user = getUserById(userId);

        if (UserRole.ADMIN.equals(user.getRole())) {
            throw new IllegalStateException("Потребителят вече е администратор");
        }

        user.setRole(UserRole.ADMIN);
        userRepository.save(user);
    }

    @Override
    public void demoteUserToUser(Long userId) {
        UserEntity user = getUserById(userId);

        if (UserRole.USER.equals(user.getRole())) {
            throw new IllegalStateException("Потребителят вече е обикновен потребител");
        }

        user.setRole(UserRole.USER);
        userRepository.save(user);
    }

    @Override
    public Map<String, Object> bulkRoleChange(List<Long> userIds, String newRole) {
        int successCount = 0;
        List<String> errors = new ArrayList<>();

        for (Long userId : userIds) {
            try {
                UserEntity user = userRepository.findById(userId).orElse(null);
                if (user == null) {
                    errors.add("User ID " + userId + ": Потребителят не е намерен");
                    continue;
                }

                if ("ADMIN".equals(newRole) && UserRole.USER.equals(user.getRole())) {
                    user.setRole(UserRole.ADMIN);
                    userRepository.save(user);
                    successCount++;
                } else if ("USER".equals(newRole) && UserRole.ADMIN.equals(user.getRole())) {
                    user.setRole(UserRole.USER);
                    userRepository.save(user);
                    successCount++;
                }

            } catch (Exception e) {
                errors.add("User ID " + userId + ": " + e.getMessage());
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("successCount", successCount);
        result.put("errors", errors);
        result.put("message", successCount + " потребители променени успешно");

        return result;
    }

    // ===== BAN MANAGEMENT =====

    @Override
    public void banUserPermanently(Long userId, String reason) {
        UserEntity user = getUserById(userId);
        UserEntity currentAdmin = userService.getCurrentUser();

        if (UserStatusEnum.PERMANENTLY_BANNED.equals(user.getStatus())) {
            throw new IllegalStateException("Потребителят вече е перманентно блокиран");
        }

        user.setStatus(UserStatusEnum.PERMANENTLY_BANNED);
        user.setBanEndDate(null);
        user.setBanReason(reason);
        user.setBannedByUsername(currentAdmin.getUsername());
        user.setBanDate(Instant.now());

        userRepository.save(user);
    }

    @Override
    public void banUserTemporarily(Long userId, String reason, int durationDays) {
        UserEntity user = getUserById(userId);
        UserEntity currentAdmin = userService.getCurrentUser();

        if (durationDays <= 0) {
            throw new IllegalArgumentException("Продължителността на бана трябва да е положително число");
        }

        Instant banEndDate = Instant.now().plus(durationDays, ChronoUnit.DAYS);

        user.setStatus(UserStatusEnum.TEMPORARILY_BANNED);
        user.setBanEndDate(banEndDate);
        user.setBanReason(reason);
        user.setBannedByUsername(currentAdmin.getUsername());
        user.setBanDate(Instant.now());

        userRepository.save(user);
    }

    @Override
    public void unbanUser(Long userId) {
        UserEntity user = getUserById(userId);

        if (!UserStatusEnum.TEMPORARILY_BANNED.equals(user.getStatus()) &&
                !UserStatusEnum.PERMANENTLY_BANNED.equals(user.getStatus())) {
            throw new IllegalStateException("Потребителят не е блокиран");
        }

        user.setStatus(UserStatusEnum.ACTIVE);
        user.setBanEndDate(null);
        user.setBanReason(null);
        user.setBannedByUsername(null);
        user.setBanDate(null);

        userRepository.save(user);
    }

    @Override
    public Map<String, Object> bulkBanUsers(List<Long> userIds, String banType, String reason, Integer durationDays) {
        UserEntity currentAdmin = userService.getCurrentUser();
        int successCount = 0;
        List<String> errors = new ArrayList<>();

        for (Long userId : userIds) {
            try {
                UserEntity user = userRepository.findById(userId).orElse(null);
                if (user == null) {
                    errors.add("User ID " + userId + ": Потребителят не е намерен");
                    continue;
                }

                if ("permanent".equals(banType)) {
                    user.setStatus(UserStatusEnum.PERMANENTLY_BANNED);
                    user.setBanEndDate(null);
                } else if ("temporary".equals(banType) && durationDays != null && durationDays > 0) {
                    user.setStatus(UserStatusEnum.TEMPORARILY_BANNED);
                    user.setBanEndDate(Instant.now().plus(durationDays, ChronoUnit.DAYS));
                } else {
                    errors.add("User ID " + userId + ": Невалиден тип бан или продължителност");
                    continue;
                }

                user.setBanReason(reason);
                user.setBannedByUsername(currentAdmin.getUsername());
                user.setBanDate(Instant.now());

                userRepository.save(user);
                successCount++;

            } catch (Exception e) {
                errors.add("User ID " + userId + ": " + e.getMessage());
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("successCount", successCount);
        result.put("errors", errors);
        result.put("message", successCount + " потребители блокирани успешно");

        return result;
    }

    // ===== USER DELETION =====

    @Override
    public void deleteUser(Long userId) {
        userService.deleteUser(userId);
    }
}