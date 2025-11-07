package smolyanVote.smolyanVote.services.serviceImpl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.UserRoleAndBansHistoryEntity;
import smolyanVote.smolyanVote.models.enums.UserRole;
import smolyanVote.smolyanVote.models.enums.UserStatusEnum;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.repositories.UserRoleAndBansHistoryRepository;
import smolyanVote.smolyanVote.services.interfaces.AdminUserManagementService;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.services.mappers.UserBanAndRolesHistoryMapper;
import smolyanVote.smolyanVote.viewsAndDTO.UserBanAndRolesHistoryDto;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@Transactional
public class AdminUserManagementServiceImpl implements AdminUserManagementService {

    private final UserRepository userRepository;
    private final UserService userService;
    private final UserRoleAndBansHistoryRepository historyRepository;
    private final UserBanAndRolesHistoryMapper userBanAndRolesHistoryMapper;

    @Autowired
    public AdminUserManagementServiceImpl(UserRepository userRepository,
                                          UserService userService,
                                          UserRoleAndBansHistoryRepository historyRepository,
                                          UserBanAndRolesHistoryMapper userBanAndRolesHistoryMapper) {
        this.userRepository = userRepository;
        this.userService = userService;
        this.historyRepository = historyRepository;
        this.userBanAndRolesHistoryMapper = userBanAndRolesHistoryMapper;
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

        long totalUsers = allUsers.size();

        long activeUsers = allUsers.stream()
                .mapToLong(u -> UserStatusEnum.ACTIVE.equals(u.getStatus()) ? 1 : 0).sum();
        long pendingUsers = allUsers.stream()
                .mapToLong(u -> UserStatusEnum.PENDING_ACTIVATION.equals(u.getStatus()) ? 1 : 0).sum();
        long tempBannedUsers = allUsers.stream()
                .mapToLong(u -> UserStatusEnum.TEMPORARILY_BANNED.equals(u.getStatus()) ? 1 : 0).sum();
        long permBannedUsers = allUsers.stream()
                .mapToLong(u -> UserStatusEnum.PERMANENTLY_BANNED.equals(u.getStatus()) ? 1 : 0).sum();

        Instant fiveMinutesAgo = Instant.now().minus(5, ChronoUnit.MINUTES);
        long onlineUsers = allUsers.stream()
                .mapToLong(u -> (u.getOnlineStatus() == 1 && u.getLastOnline() != null &&
                        u.getLastOnline().isAfter(fiveMinutesAgo)) ? 1 : 0).sum();

        long adminCount = allUsers.stream()
                .mapToLong(u -> UserRole.ADMIN.equals(u.getRole()) ? 1 : 0).sum();
        long userCount = allUsers.stream()
                .mapToLong(u -> UserRole.USER.equals(u.getRole()) ? 1 : 0).sum();

        Instant todayStart = Instant.now().truncatedTo(ChronoUnit.DAYS);
        Instant weekStart = Instant.now().minus(7, ChronoUnit.DAYS);
        Instant monthStart = Instant.now().minus(30, ChronoUnit.DAYS);

        long todayRegistrations = allUsers.stream()
                .mapToLong(u -> u.getCreated().isAfter(todayStart) ? 1 : 0).sum();
        long weekRegistrations = allUsers.stream()
                .mapToLong(u -> u.getCreated().isAfter(weekStart) ? 1 : 0).sum();
        long monthRegistrations = allUsers.stream()
                .mapToLong(u -> u.getCreated().isAfter(monthStart) ? 1 : 0).sum();

        double avgEngagement = allUsers.stream()
                .mapToDouble(u -> u.getUserEventsCount() + u.getPublicationsCount() + u.getTotalVotes())
                .average().orElse(0.0);

        long highActivityUsers = allUsers.stream()
                .mapToLong(u -> (u.getUserEventsCount() + u.getPublicationsCount() > 5) ? 1 : 0).sum();

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
    public Map<String, String> changeUserRole(Long userId, String newRole, String reason) {
        try {
            UserEntity user = getUserById(userId);
            UserEntity currentAdmin = userService.getCurrentUser();

            if (!"ADMIN".equals(newRole) && !"USER".equals(newRole)) {
                return Map.of("error", "Невалидна роля");
            }

            UserRole targetRole = "ADMIN".equals(newRole) ? UserRole.ADMIN : UserRole.USER;

            if (targetRole.equals(user.getRole())) {
                return Map.of("error", "Потребителят вече има тази роля");
            }

            UserRole oldRole = user.getRole();
            user.setRole(targetRole);
            userRepository.save(user);

            recordRoleChange(user, currentAdmin, oldRole, targetRole, reason);

            String message = "ADMIN".equals(newRole) ?
                    "Потребителят е повишен до администратор" :
                    "Потребителят е понижен до обикновен потребител";

            return Map.of("message", message);
        } catch (Exception e) {
            return Map.of("error", "Грешка при промяна на роля: " + e.getMessage());
        }
    }

    @Override
    public Map<String, Object> bulkRoleChange(List<Long> userIds, String newRole) {
        int successCount = 0;
        List<String> errors = new ArrayList<>();

        for (Long userId : userIds) {
            try {
                Map<String, String> result = changeUserRole(userId, newRole, "Bulk операция - промяна на роля");
                if (result.containsKey("error")) {
                    errors.add("User ID " + userId + ": " + result.get("error"));
                } else {
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
    public Map<String, String> banUser(Long userId, String reason, String banType, Integer durationDays) {
        try {
            if ("permanent".equals(banType)) {
                banUserPermanently(userId, reason);
                return Map.of("message", "Потребителят е блокиран перманентно");
            } else if ("temporary".equals(banType) && durationDays != null) {
                banUserTemporarily(userId, reason, durationDays);
                return Map.of("message", "Потребителят е блокиран за " + durationDays + " дни");
            } else {
                return Map.of("error", "Невалиден тип блокиране");
            }
        } catch (Exception e) {
            return Map.of("error", "Грешка при блокиране: " + e.getMessage());
        }
    }

    @Override
    public Map<String, String> unbanUser(Long userId) {
        try {
            UserEntity user = getUserById(userId);
            UserEntity currentAdmin = userService.getCurrentUser();

            if (!UserStatusEnum.TEMPORARILY_BANNED.equals(user.getStatus()) &&
                    !UserStatusEnum.PERMANENTLY_BANNED.equals(user.getStatus())) {
                return Map.of("error", "Потребителят не е блокиран");
            }

            UserStatusEnum oldStatus = user.getStatus();
            user.setStatus(UserStatusEnum.ACTIVE);
            user.setBanEndDate(null);
            user.setBanReason(null);
            user.setBannedByUsername(null);
            user.setBanDate(null);

            userRepository.save(user);

            recordUnbanAction(user, currentAdmin, "Ръчно отблокиране от администратор", oldStatus);

            return Map.of("message", "Потребителят е отблокиран успешно");
        } catch (Exception e) {
            return Map.of("error", "Грешка при отблокиране: " + e.getMessage());
        }
    }

    @Override
    public Map<String, Object> bulkBanUsers(List<Long> userIds, String banType, String reason, Integer durationDays) {
        int successCount = 0;
        List<String> errors = new ArrayList<>();

        for (Long userId : userIds) {
            try {
                Map<String, String> result = banUser(userId, reason, banType, durationDays);
                if (result.containsKey("error")) {
                    errors.add("User ID " + userId + ": " + result.get("error"));
                } else {
                    successCount++;
                }
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

    // ===== PRIVATE HELPER METHODS =====

    private void banUserPermanently(Long userId, String reason) {
        UserEntity user = getUserById(userId);
        UserEntity currentAdmin = userService.getCurrentUser();

        if (UserStatusEnum.PERMANENTLY_BANNED.equals(user.getStatus())) {
            throw new IllegalStateException("Потребителят вече е перманентно блокиран");
        }

        UserStatusEnum oldStatus = user.getStatus();
        user.setStatus(UserStatusEnum.PERMANENTLY_BANNED);
        user.setBanEndDate(null);
        user.setBanReason(reason);
        user.setBannedByUsername(currentAdmin.getUsername());
        user.setBanDate(Instant.now());

        userRepository.save(user);

        recordBanAction(user, currentAdmin, "PERMANENT", reason, null, oldStatus, UserStatusEnum.PERMANENTLY_BANNED);
    }

    private void banUserTemporarily(Long userId, String reason, int durationDays) {
        UserEntity user = getUserById(userId);
        UserEntity currentAdmin = userService.getCurrentUser();

        if (durationDays <= 0) {
            throw new IllegalArgumentException("Продължителността на бана трябва да е положително число");
        }

        UserStatusEnum oldStatus = user.getStatus();
        Instant banEndDate = Instant.now().plus(durationDays, ChronoUnit.DAYS);

        user.setStatus(UserStatusEnum.TEMPORARILY_BANNED);
        user.setBanEndDate(banEndDate);
        user.setBanReason(reason);
        user.setBannedByUsername(currentAdmin.getUsername());
        user.setBanDate(Instant.now());

        userRepository.save(user);

        recordBanAction(user, currentAdmin, "TEMPORARY", reason, durationDays, oldStatus, UserStatusEnum.TEMPORARILY_BANNED);
    }

    // ===== USER ACTIVATION =====

    @Override
    public Map<String, String> activateUser(Long userId) {
        try {
            UserEntity user = getUserById(userId);
            UserEntity currentAdmin = userService.getCurrentUser();

            // Check if user is already active
            if (UserStatusEnum.ACTIVE.equals(user.getStatus())) {
                return Map.of("error", "Потребителят вече е активен");
            }

            // Check if user is pending activation
            if (!UserStatusEnum.PENDING_ACTIVATION.equals(user.getStatus())) {
                return Map.of("error", "Потребителят не чака активация");
            }

            UserStatusEnum oldStatus = user.getStatus();
            user.setStatus(UserStatusEnum.ACTIVE);

            userRepository.save(user);
            recordActivationAction(user, currentAdmin, oldStatus);

            return Map.of("message", "Потребителят е активиран успешно");
        } catch (Exception e) {
            return Map.of("error", "Грешка при активация: " + e.getMessage());
        }
    }

    @Override
    public Map<String, Object> bulkActivateUsers(List<Long> userIds) {
        Map<String, Object> result = new HashMap<>();
        List<String> successMessages = new ArrayList<>();
        List<String> errorMessages = new ArrayList<>();
        int successCount = 0;
        int errorCount = 0;

        for (Long userId : userIds) {
            Map<String, String> singleResult = activateUser(userId);
            if (singleResult.containsKey("message")) {
                successMessages.add("User ID " + userId + ": " + singleResult.get("message"));
                successCount++;
            } else {
                errorMessages.add("User ID " + userId + ": " + singleResult.get("error"));
                errorCount++;
            }
        }

        result.put("successCount", successCount);
        result.put("errorCount", errorCount);
        result.put("successMessages", successMessages);
        result.put("errorMessages", errorMessages);
        result.put("totalProcessed", userIds.size());

        return result;
    }

    // ===== USER DELETION =====

    @Override
    public Map<String, String> deleteUser(Long userId) {
        try {
            userService.deleteUser(userId);
            return Map.of("message", "Потребителят е изтрит успешно");
        } catch (Exception e) {
            return Map.of("error", "Грешка при изтриване: " + e.getMessage());
        }
    }

    // ===== HISTORY MANAGEMENT =====

    @Override
    public void recordRoleChange(UserEntity targetUser, UserEntity adminUser,
                                 UserRole oldRole, UserRole newRole, String reason) {
        UserRoleAndBansHistoryEntity history = new UserRoleAndBansHistoryEntity();
        history.setTargetUsername(targetUser.getUsername());
        history.setAdminUsername(adminUser.getUsername());
        history.setActionType("ROLE_CHANGE");
        history.setActionTimestamp(Instant.now());
        history.setReason(reason);
        history.setOldRole(oldRole);
        history.setNewRole(newRole);

        historyRepository.save(history);
    }

    @Override
    public void recordBanAction(UserEntity targetUser, UserEntity adminUser,
                                String banType, String reason, Integer durationDays,
                                UserStatusEnum oldStatus, UserStatusEnum newStatus) {
        UserRoleAndBansHistoryEntity history = new UserRoleAndBansHistoryEntity();
        history.setTargetUsername(targetUser.getUsername());
        history.setAdminUsername(adminUser.getUsername());
        history.setActionType("BAN");
        history.setActionTimestamp(Instant.now());
        history.setReason(reason);
        history.setBanType(banType);
        history.setBanDurationDays(durationDays);
        history.setOldStatus(oldStatus);
        history.setNewStatus(newStatus);

        historyRepository.save(history);
    }

    @Override
    public void recordUnbanAction(UserEntity targetUser, UserEntity adminUser,
                                  String reason, UserStatusEnum oldStatus) {
        UserRoleAndBansHistoryEntity history = new UserRoleAndBansHistoryEntity();
        history.setTargetUsername(targetUser.getUsername());
        history.setAdminUsername(adminUser.getUsername());
        history.setActionType("UNBAN");
        history.setActionTimestamp(Instant.now());
        history.setReason(reason);
        history.setOldStatus(oldStatus);
        history.setNewStatus(UserStatusEnum.ACTIVE);

        historyRepository.save(history);
    }

    @Override
    public void recordActivationAction(UserEntity targetUser, UserEntity adminUser, UserStatusEnum oldStatus) {
        UserRoleAndBansHistoryEntity history = new UserRoleAndBansHistoryEntity();
        history.setTargetUsername(targetUser.getUsername());
        history.setAdminUsername(adminUser.getUsername());
        history.setActionType("ACTIVATION");
        history.setActionTimestamp(Instant.now());
        history.setReason("Активиране на потребителски акаунт");
        history.setOldStatus(oldStatus);
        history.setNewStatus(UserStatusEnum.ACTIVE);

        historyRepository.save(history);
    }

    @Transactional(readOnly = true)
    @Override
    public List<UserBanAndRolesHistoryDto> getAllHistory() {
        List<UserRoleAndBansHistoryEntity> history = historyRepository.findAllOrderByTimestampDesc();
        return userBanAndRolesHistoryMapper.mapToDtoList(history);
    }

    @Transactional(readOnly = true)
    @Override
    public List<UserBanAndRolesHistoryDto> getHistoryForUser(String username) {
        List<UserRoleAndBansHistoryEntity> history = historyRepository.findByTargetUsernameOrderByActionTimestampDesc(username);
        return userBanAndRolesHistoryMapper.mapToDtoList(history);
    }

    @Transactional(readOnly = true)
    @Override
    public List<UserBanAndRolesHistoryDto> getRecentHistory(int limit) {
        List<UserRoleAndBansHistoryEntity> history = historyRepository.findRecentHistory(limit);
        return userBanAndRolesHistoryMapper.mapToDtoList(history);
    }
}