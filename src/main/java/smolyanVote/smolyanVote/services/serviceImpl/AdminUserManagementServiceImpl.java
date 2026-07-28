package smolyanVote.smolyanVote.services.serviceImpl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import smolyanVote.smolyanVote.componentsAndSecurity.MasterAdminPolicy;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.UserRoleAndBansHistoryEntity;
import smolyanVote.smolyanVote.models.enums.ActivityActionEnum;
import smolyanVote.smolyanVote.models.enums.ActivityTypeEnum;
import smolyanVote.smolyanVote.models.enums.UserRole;
import smolyanVote.smolyanVote.models.enums.UserStatusEnum;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.repositories.UserRoleAndBansHistoryRepository;
import smolyanVote.smolyanVote.services.interfaces.ActivityLogService;
import smolyanVote.smolyanVote.services.interfaces.AdminUserManagementService;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.services.mappers.AdminUserManagementMapper;
import smolyanVote.smolyanVote.services.mappers.UserBanAndRolesHistoryMapper;
import smolyanVote.smolyanVote.viewsAndDTO.AdminUserViewDTO;
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
    private final AdminUserManagementMapper adminUserManagementMapper;
    private final ActivityLogService activityLogService;
    private final MasterAdminPolicy masterAdminPolicy;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public AdminUserManagementServiceImpl(UserRepository userRepository,
                                          UserService userService,
                                          UserRoleAndBansHistoryRepository historyRepository,
                                          UserBanAndRolesHistoryMapper userBanAndRolesHistoryMapper,
                                          AdminUserManagementMapper adminUserManagementMapper,
                                          ActivityLogService activityLogService,
                                          MasterAdminPolicy masterAdminPolicy,
                                          PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.userService = userService;
        this.historyRepository = historyRepository;
        this.userBanAndRolesHistoryMapper = userBanAndRolesHistoryMapper;
        this.adminUserManagementMapper = adminUserManagementMapper;
        this.activityLogService = activityLogService;
        this.masterAdminPolicy = masterAdminPolicy;
        this.passwordEncoder = passwordEncoder;
    }

    // ===== USER RETRIEVAL =====

    @Override
    @Transactional(readOnly = true)
    public List<UserEntity> getAllUsers() {
        return userRepository.findAllUsersForAdminDashboard();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AdminUserViewDTO> getUsersPage(String search, UserRole role, UserStatusEnum status, Integer minStrikes, Pageable pageable) {
        String normalizedSearch = (search == null || search.isBlank()) ? null : search.trim();
        return userRepository.findAdminUsers(normalizedSearch, role, status, minStrikes, pageable)
                .map(adminUserManagementMapper::mapUserToAdminView);
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

            if (UserRole.USER.equals(targetRole)) {
                Optional<String> demoteBlocked = masterAdminPolicy.demoteBlockedReason(user);
                if (demoteBlocked.isPresent()) {
                    return Map.of("error", demoteBlocked.get());
                }
            }

            if (UserRole.ADMIN.equals(targetRole)
                    && (currentAdmin == null || !UserRole.ADMIN.equals(currentAdmin.getRole()))) {
                return Map.of("error", "Само администратор може да повишава потребители до ADMIN");
            }

            if (UserRole.ADMIN.equals(targetRole) && user.getId().equals(currentAdmin.getId())) {
                return Map.of("error", "Не можете да повишите собствения си акаунт");
            }

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
    public Map<String, String> changeUserPassword(Long userId, String password, String confirmPassword, String reason) {
        try {
            if (password == null || password.isBlank()) {
                return Map.of("error", "Паролата е задължителна");
            }
            if (password.length() < 6) {
                return Map.of("error", "Паролата трябва да бъде поне 6 символа");
            }
            if (!password.equals(confirmPassword)) {
                return Map.of("error", "Паролите не съвпадат");
            }
            if (reason == null || reason.isBlank()) {
                return Map.of("error", "Причината е задължителна");
            }

            UserEntity user = getUserById(userId);
            UserEntity currentAdmin = userService.getCurrentUser();

            user.setPassword(passwordEncoder.encode(password));
            userRepository.save(user);

            String details = "Admin password reset for " + user.getUsername() + ": " + reason.trim();
            activityLogService.logActivity(
                    ActivityActionEnum.ADMIN_RESET_USER_PASSWORD,
                    currentAdmin,
                    ActivityTypeEnum.USER.name(),
                    userId,
                    details,
                    extractIpAddress(),
                    extractUserAgent());

            return Map.of("message", "Паролата е сменена успешно");
        } catch (Exception e) {
            return Map.of("error", "Грешка при смяна на парола: " + e.getMessage());
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
    public Map<String, String> banUser(Long userId, String reason, String banType, Integer durationDays, Integer durationHours) {
        try {
            UserEntity user = getUserById(userId);
            Optional<String> banBlocked = masterAdminPolicy.banBlockedReason(user);
            if (banBlocked.isPresent()) {
                return Map.of("error", banBlocked.get());
            }

            String normalizedBanType = banType != null ? banType.trim().toLowerCase(Locale.ROOT) : "";
            if ("permanent".equals(normalizedBanType)) {
                banUserPermanently(userId, reason);
                return Map.of("message", "Потребителят е блокиран перманентно");
            } else if ("temporary".equals(normalizedBanType) && hasValidTemporaryDuration(durationDays, durationHours)) {
                banUserTemporarily(userId, reason, durationDays, durationHours);
                return Map.of("message", "Потребителят е блокиран за " + formatTemporaryBanDuration(durationDays, durationHours));
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
    public Map<String, Object> bulkBanUsers(List<Long> userIds, String banType, String reason, Integer durationDays, Integer durationHours) {
        int successCount = 0;
        List<String> errors = new ArrayList<>();

        for (Long userId : userIds) {
            try {
                Map<String, String> result = banUser(userId, reason, banType, durationDays, durationHours);
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

        recordBanAction(user, currentAdmin, "PERMANENT", reason, null, null, oldStatus, UserStatusEnum.PERMANENTLY_BANNED);
    }

    private void banUserTemporarily(Long userId, String reason, Integer durationDays, Integer durationHours) {
        UserEntity user = getUserById(userId);
        UserEntity currentAdmin = userService.getCurrentUser();

        int days = durationDays != null ? durationDays : 0;
        int hours = durationHours != null ? durationHours : 0;
        if (days <= 0 && hours <= 0) {
            throw new IllegalArgumentException("Продължителността на бана трябва да е поне 1 ден или 1 час");
        }

        UserStatusEnum oldStatus = user.getStatus();
        Instant banEndDate = Instant.now()
                .plus(days, ChronoUnit.DAYS)
                .plus(hours, ChronoUnit.HOURS);

        user.setStatus(UserStatusEnum.TEMPORARILY_BANNED);
        user.setBanEndDate(banEndDate);
        user.setBanReason(reason);
        user.setBannedByUsername(currentAdmin.getUsername());
        user.setBanDate(Instant.now());

        userRepository.save(user);

        recordBanAction(
                user,
                currentAdmin,
                "TEMPORARY",
                reason,
                days > 0 ? days : null,
                hours > 0 ? hours : null,
                oldStatus,
                UserStatusEnum.TEMPORARILY_BANNED);
    }

    private static boolean hasValidTemporaryDuration(Integer durationDays, Integer durationHours) {
        int days = durationDays != null ? durationDays : 0;
        int hours = durationHours != null ? durationHours : 0;
        return days > 0 || hours > 0;
    }

    private static String formatTemporaryBanDuration(Integer durationDays, Integer durationHours) {
        int days = durationDays != null ? durationDays : 0;
        int hours = durationHours != null ? durationHours : 0;
        if (days > 0 && hours > 0) {
            return days + " дни и " + hours + " часа";
        }
        if (days > 0) {
            return days + " дни";
        }
        return hours + " часа";
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
            UserEntity user = getUserById(userId);
            Optional<String> deleteBlocked = masterAdminPolicy.deleteBlockedReason(user);
            if (deleteBlocked.isPresent()) {
                return Map.of("error", deleteBlocked.get());
            }

            userService.deleteUser(userId);
            return Map.of("message", "Потребителят е изтрит успешно");
        } catch (Exception e) {
            return Map.of("error", "Грешка при изтриване: " + e.getMessage());
        }
    }

    @Override
    public Map<String, String> resetModerationStrikes(Long userId) {
        try {
            UserEntity user = getUserById(userId);
            UserEntity admin = userService.getCurrentUser();
            int previous = user.getModerationStrikeCount();
            user.setModerationStrikeCount(0);
            userRepository.save(user);
            activityLogService.logActivity(
                    ActivityActionEnum.ADMIN_REVIEW_REPORT,
                    admin,
                    ActivityTypeEnum.USER.name(),
                    userId,
                    "Reset moderation strikes: " + previous + " → 0",
                    null,
                    null);
            return Map.of("message", "Strike count е нулиран");
        } catch (Exception e) {
            return Map.of("error", "Грешка при нулиране: " + e.getMessage());
        }
    }

    @Override
    public Map<String, Object> bulkResetModerationStrikes(List<Long> userIds) {
        int success = 0;
        List<String> errors = new ArrayList<>();
        for (Long userId : userIds) {
            Map<String, String> result = resetModerationStrikes(userId);
            if (result.containsKey("error")) {
                errors.add(userId + ": " + result.get("error"));
            } else {
                success++;
            }
        }
        Map<String, Object> response = new HashMap<>();
        response.put("successCount", success);
        response.put("errorCount", errors.size());
        response.put("errors", errors);
        return response;
    }

    @Override
    public Map<String, Object> bulkDeleteUsers(List<Long> userIds) {
        Map<String, Object> result = new HashMap<>();
        List<String> successMessages = new ArrayList<>();
        List<String> errorMessages = new ArrayList<>();
        int successCount = 0;
        int errorCount = 0;

        UserEntity currentAdmin = userService.getCurrentUser();

        for (Long userId : userIds) {
            if (currentAdmin != null && currentAdmin.getId().equals(userId)) {
                errorMessages.add("User ID " + userId + ": Не можете да изтриете собствения си профил от bulk.");
                errorCount++;
                continue;
            }
            Map<String, String> singleResult = deleteUser(userId);
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

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getStrikeStatistics() {
        List<UserEntity> allUsers = userRepository.findAll();
        Map<String, Object> stats = new HashMap<>();
        stats.put("withOneStrike", allUsers.stream().filter(u -> u.getModerationStrikeCount() == 1).count());
        stats.put("withTwoStrikes", allUsers.stream().filter(u -> u.getModerationStrikeCount() == 2).count());
        stats.put("withThreeOrMore", allUsers.stream().filter(u -> u.getModerationStrikeCount() >= 3).count());
        stats.put("autoBannedNow", allUsers.stream()
                .filter(u -> UserStatusEnum.TEMPORARILY_BANNED.equals(u.getStatus())
                        && u.getModerationStrikeCount() >= 3)
                .count());
        return stats;
    }

    @Override
    @Transactional(readOnly = true)
    public String exportUsersCsv(String search, UserRole role, UserStatusEnum status, Integer minStrikes) {
        Page<AdminUserViewDTO> page = getUsersPage(search, role, status, minStrikes, PageRequest.of(0, 10_000));
        StringBuilder csv = new StringBuilder(
                "id,username,email,role,status,strikes,lastOnline,created,publications,votes\n");
        for (AdminUserViewDTO user : page.getContent()) {
            csv.append(user.getId()).append(',')
                    .append(csvCell(user.getUsername())).append(',')
                    .append(csvCell(user.getEmail())).append(',')
                    .append(user.getRole()).append(',')
                    .append(user.getStatus()).append(',')
                    .append(user.getModerationStrikeCount()).append(',')
                    .append(user.getLastOnline()).append(',')
                    .append(user.getCreated()).append(',')
                    .append(user.getPublicationsCount()).append(',')
                    .append(user.getTotalVotes()).append('\n');
        }
        return csv.toString();
    }

    private static String csvCell(String value) {
        if (value == null) {
            return "";
        }
        return "\"" + value.replace("\"", "\"\"") + "\"";
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

        // ✅ ЛОГИРАНЕ НА ADMIN_PROMOTE_USER / ADMIN_DEMOTE_USER
        try {
            String ipAddress = extractIpAddress();
            String userAgent = extractUserAgent();
            ActivityActionEnum action = (newRole == UserRole.ADMIN && oldRole == UserRole.USER) 
                    ? ActivityActionEnum.ADMIN_PROMOTE_USER 
                    : ActivityActionEnum.ADMIN_DEMOTE_USER;
            String details = String.format("Role changed: %s → %s (Reason: %s)", 
                    oldRole.name(), newRole.name(), reason != null ? reason : "N/A");
            activityLogService.logActivity(action, adminUser, ActivityTypeEnum.USER.name(), 
                    targetUser.getId(), details, ipAddress, userAgent);
        } catch (Exception e) {
            System.err.println("Failed to log role change activity: " + e.getMessage());
        }
    }

    @Override
    public void recordBanAction(UserEntity targetUser, UserEntity adminUser,
                                String banType, String reason, Integer durationDays, Integer durationHours,
                                UserStatusEnum oldStatus, UserStatusEnum newStatus) {
        UserRoleAndBansHistoryEntity history = new UserRoleAndBansHistoryEntity();
        history.setTargetUsername(targetUser.getUsername());
        history.setAdminUsername(adminUser.getUsername());
        history.setActionType("BAN");
        history.setActionTimestamp(Instant.now());
        history.setReason(reason);
        history.setBanType(banType);
        history.setBanDurationDays(durationDays);
        history.setBanDurationHours(durationHours);
        history.setOldStatus(oldStatus);
        history.setNewStatus(newStatus);

        historyRepository.save(history);

        // ✅ ЛОГИРАНЕ НА ADMIN_BAN_USER
        try {
            String ipAddress = extractIpAddress();
            String userAgent = extractUserAgent();
            String durationText = "TEMPORARY".equals(banType)
                    ? ", Duration: " + formatTemporaryBanDuration(durationDays, durationHours)
                    : "";
            String details = String.format("Banned user: %s (Type: %s, Reason: %s%s)",
                    targetUser.getUsername(), banType, reason != null ? reason : "N/A", durationText);
            activityLogService.logActivity(ActivityActionEnum.ADMIN_BAN_USER, adminUser,
                    ActivityTypeEnum.USER.name(), targetUser.getId(), details, ipAddress, userAgent);
        } catch (Exception e) {
            System.err.println("Failed to log ban activity: " + e.getMessage());
        }
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