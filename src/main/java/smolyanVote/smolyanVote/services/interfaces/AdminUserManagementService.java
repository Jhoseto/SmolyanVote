package smolyanVote.smolyanVote.services.interfaces;

import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.UserRole;
import smolyanVote.smolyanVote.models.enums.UserStatusEnum;
import smolyanVote.smolyanVote.viewsAndDTO.UserBanAndRolesHistoryDto;

import java.util.List;
import java.util.Map;

public interface AdminUserManagementService {

    // ===== USER RETRIEVAL =====
    List<UserEntity> getAllUsers();
    UserEntity getUserById(Long userId);

    // ===== USER STATISTICS =====
    Map<String, Object> getUserStatistics();

    // ===== ROLE MANAGEMENT =====
    Map<String, String> changeUserRole(Long userId, String newRole, String reason);
    Map<String, Object> bulkRoleChange(List<Long> userIds, String newRole);

    // ===== BAN MANAGEMENT =====
    Map<String, String> banUser(Long userId, String reason, String banType, Integer durationDays);
    Map<String, String> unbanUser(Long userId);
    Map<String, Object> bulkBanUsers(List<Long> userIds, String banType, String reason, Integer durationDays);

    // ===== USER ACTIVATION =====
    Map<String, String> activateUser(Long userId);
    Map<String, Object> bulkActivateUsers(List<Long> userIds);

    // ===== USER DELETION =====
    Map<String, String> deleteUser(Long userId);

    // ===== HISTORY MANAGEMENT =====
    void recordRoleChange(UserEntity targetUser, UserEntity adminUser, UserRole oldRole, UserRole newRole, String reason);
    void recordBanAction(UserEntity targetUser, UserEntity adminUser, String banType, String reason, Integer durationDays, UserStatusEnum oldStatus, UserStatusEnum newStatus);
    void recordUnbanAction(UserEntity targetUser, UserEntity adminUser, String reason, UserStatusEnum oldStatus);
    void recordActivationAction(UserEntity targetUser, UserEntity adminUser, UserStatusEnum oldStatus);

    @Transactional(readOnly = true)
    List<UserBanAndRolesHistoryDto> getAllHistory();

    @Transactional(readOnly = true)
    List<UserBanAndRolesHistoryDto> getHistoryForUser(String username);

    @Transactional(readOnly = true)
    List<UserBanAndRolesHistoryDto> getRecentHistory(int limit);
}