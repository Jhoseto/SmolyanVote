package smolyanVote.smolyanVote.services.interfaces;

import smolyanVote.smolyanVote.models.UserEntity;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public interface AdminUserManagementService {

    // ===== USER RETRIEVAL =====

    List<UserEntity> getAllUsers();

    UserEntity getUserById(Long userId);

    // ===== USER STATISTICS =====

    Map<String, Object> getUserStatistics();

    // ===== ROLE MANAGEMENT =====

    void promoteUserToAdmin(Long userId);

    void demoteUserToUser(Long userId);

    Map<String, Object> bulkRoleChange(List<Long> userIds, String newRole);

    // ===== BAN MANAGEMENT =====

    void banUserPermanently(Long userId, String reason);

    void banUserTemporarily(Long userId, String reason, int durationDays);

    void unbanUser(Long userId);

    Map<String, Object> bulkBanUsers(List<Long> userIds, String banType, String reason, Integer durationDays);

    // ===== USER DELETION =====

    void deleteUser(Long userId);
}