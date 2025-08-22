package smolyanVote.smolyanVote.services.serviceImpl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.UserRoleAndBansHistoryEntity;
import smolyanVote.smolyanVote.models.enums.UserRole;
import smolyanVote.smolyanVote.models.enums.UserStatusEnum;
import smolyanVote.smolyanVote.repositories.UserRoleAndBansHistoryRepository;
import smolyanVote.smolyanVote.services.interfaces.UserHistoryService;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserHistoryServiceImpl implements UserHistoryService {

    private final UserRoleAndBansHistoryRepository historyRepository;

    @Autowired
    public UserHistoryServiceImpl(UserRoleAndBansHistoryRepository historyRepository) {
        this.historyRepository = historyRepository;
    }

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

    @Transactional(readOnly = true)
    @Override
    public List<Map<String, Object>> getAllHistory() {
        List<UserRoleAndBansHistoryEntity> history = historyRepository.findAllOrderByTimestampDesc();
        return history.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    @Override
    public List<Map<String, Object>> getHistoryForUser(String username) {
        List<UserRoleAndBansHistoryEntity> history = historyRepository.findByTargetUsernameOrderByActionTimestampDesc(username);
        return history.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    @Override
    public List<Map<String, Object>> getRecentHistory(int limit) {
        List<UserRoleAndBansHistoryEntity> history = historyRepository.findRecentHistory(limit);
        return history.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private Map<String, Object> mapToResponse(UserRoleAndBansHistoryEntity history) {
        Map<String, Object> response = new HashMap<>();

        response.put("id", history.getId());
        response.put("targetUsername", history.getTargetUsername());
        response.put("adminUsername", history.getAdminUsername());
        response.put("actionType", history.getActionType());
        response.put("actionTimestamp", history.getActionTimestamp());
        response.put("reason", history.getReason());

        // Role change data
        if ("ROLE_CHANGE".equals(history.getActionType())) {
            response.put("oldRole", history.getOldRole());
            response.put("newRole", history.getNewRole());
        }

        // Ban/Unban data
        if ("BAN".equals(history.getActionType()) || "UNBAN".equals(history.getActionType())) {
            response.put("banType", history.getBanType());
            response.put("banDurationDays", history.getBanDurationDays());
            response.put("oldStatus", history.getOldStatus());
            response.put("newStatus", history.getNewStatus());
        }

        return response;
    }
}