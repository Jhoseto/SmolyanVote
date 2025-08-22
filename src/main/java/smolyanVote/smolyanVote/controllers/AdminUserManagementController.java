package smolyanVote.smolyanVote.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.UserRoleAndBansHistoryEntity;
import smolyanVote.smolyanVote.repositories.UserRoleAndBansHistoryRepository;
import smolyanVote.smolyanVote.services.interfaces.AdminUserManagementService;
import smolyanVote.smolyanVote.services.mappers.AdminUserManagementMapper;
import smolyanVote.smolyanVote.viewsAndDTO.AdminUserViewDTO;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserManagementController {

    private final AdminUserManagementService adminUserManagementService;
    private final AdminUserManagementMapper adminUserManagementMapper;

    @Autowired
    public AdminUserManagementController(AdminUserManagementService adminUserManagementService,
                                         AdminUserManagementMapper adminUserManagementMapper) {
        this.adminUserManagementService = adminUserManagementService;
        this.adminUserManagementMapper = adminUserManagementMapper;
    }

    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getUserStatistics() {
        return ResponseEntity.ok(adminUserManagementService.getUserStatistics());
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllUsers() {
        List<UserEntity> users = adminUserManagementService.getAllUsers();
        List<AdminUserViewDTO> mappedUsers = adminUserManagementMapper.mapUsersToAdminView(users);
        return ResponseEntity.ok(Map.of("users", mappedUsers, "totalCount", mappedUsers.size()));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<AdminUserViewDTO> getUserDetails(@PathVariable Long userId) {
        UserEntity user = adminUserManagementService.getUserById(userId);
        return ResponseEntity.ok(adminUserManagementMapper.mapUserToAdminView(user));
    }

    @PostMapping("/{userId}/ban")
    public ResponseEntity<Map<String, Object>> banUser(@PathVariable Long userId,
                                                       @RequestBody Map<String, Object> request) {
        String banType = (String) request.get("banType");
        String reason = (String) request.get("reason");
        Integer durationDays = (Integer) request.get("durationDays");

        if ("permanent".equals(banType)) {
            adminUserManagementService.banUserPermanently(userId, reason);
            return ResponseEntity.ok(Map.of("success", true, "message", "Потребителят е блокиран перманентно"));
        } else if ("temporary".equals(banType) && durationDays != null) {
            adminUserManagementService.banUserTemporarily(userId, reason, durationDays);
            return ResponseEntity.ok(Map.of("success", true, "message", "Потребителят е блокиран за " + durationDays + " дни"));
        }
        return ResponseEntity.badRequest().body(Map.of("error", "Невалиден тип блокиране"));
    }

    @PostMapping("/{userId}/unban")
    public ResponseEntity<Map<String, Object>> unbanUser(@PathVariable Long userId) {
        adminUserManagementService.unbanUser(userId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Потребителят е отблокиран успешно"));
    }

    @PostMapping("/{userId}/role")
    public ResponseEntity<Map<String, Object>> changeUserRole(@PathVariable Long userId,
                                                              @RequestBody Map<String, String> request) {
        String newRole = request.get("role");

        if ("ADMIN".equals(newRole)) {
            adminUserManagementService.promoteUserToAdmin(userId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Потребителят е повишен до администратор"));
        } else if ("USER".equals(newRole)) {
            adminUserManagementService.demoteUserToUser(userId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Потребителят е понижен до обикновен потребител"));
        }
        return ResponseEntity.badRequest().body(Map.of("error", "Невалидна роля"));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable Long userId) {
        adminUserManagementService.deleteUser(userId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Потребителят е изтрит успешно"));
    }

    @PostMapping("/bulk-ban")
    public ResponseEntity<Map<String, Object>> bulkBanUsers(@RequestBody Map<String, Object> request) {

        @SuppressWarnings("unchecked")
        List<Integer> userIdsInt = (List<Integer>) request.get("userIds");
        List<Long> userIds = userIdsInt.stream().map(Integer::longValue).collect(Collectors.toList());

        String banType = (String) request.get("banType");
        String reason = (String) request.get("reason");
        Integer durationDays = (Integer) request.get("durationDays");

        return ResponseEntity.ok(adminUserManagementService.bulkBanUsers(userIds, banType, reason, durationDays));
    }

    @PostMapping("/bulk-role")
    public ResponseEntity<Map<String, Object>> bulkChangeRole(@RequestBody Map<String, Object> request) {

        @SuppressWarnings("unchecked")
        List<Integer> userIdsInt = (List<Integer>) request.get("userIds");
        List<Long> userIds = userIdsInt.stream().map(Integer::longValue).collect(Collectors.toList());

        String newRole = (String) request.get("role");

        return ResponseEntity.ok(adminUserManagementService.bulkRoleChange(userIds, newRole));
    }


    @GetMapping("/history")
    public ResponseEntity<List<Map<String, Object>>> getUserRoleAndBansHistory() {
        try {
            List<UserRoleAndBansHistoryEntity> history = getAllUsers();

            List<Map<String, Object>> historyData = history.stream()
                    .map(this::mapHistoryToResponse)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(historyData);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.emptyList());
        }
    }

    private Map<String, Object> mapHistoryToResponse(UserRoleAndBansHistoryEntity history) {
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

        // Ban data
        if ("BAN".equals(history.getActionType()) || "UNBAN".equals(history.getActionType())) {
            response.put("banType", history.getBanType());
            response.put("banDurationDays", history.getBanDurationDays());
            response.put("oldStatus", history.getOldStatus());
            response.put("newStatus", history.getNewStatus());
        }

        return response;
    }
}