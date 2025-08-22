package smolyanVote.smolyanVote.services.interfaces;

import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.UserRole;
import smolyanVote.smolyanVote.models.enums.UserStatusEnum;

import java.util.List;
import java.util.Map;

public interface UserHistoryService {
    void recordRoleChange(UserEntity targetUser, UserEntity adminUser,
                          UserRole oldRole, UserRole newRole, String reason);

    void recordBanAction(UserEntity targetUser, UserEntity adminUser,
                         String banType, String reason, Integer durationDays,
                         UserStatusEnum oldStatus, UserStatusEnum newStatus);

    void recordUnbanAction(UserEntity targetUser, UserEntity adminUser,
                           String reason, UserStatusEnum oldStatus);

    @Transactional(readOnly = true)
    List<Map<String, Object>> getAllHistory();

    @Transactional(readOnly = true)
    List<Map<String, Object>> getHistoryForUser(String username);

    @Transactional(readOnly = true)
    List<Map<String, Object>> getRecentHistory(int limit);
}
