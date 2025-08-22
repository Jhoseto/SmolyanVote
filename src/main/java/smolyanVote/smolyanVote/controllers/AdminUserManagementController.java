package smolyanVote.smolyanVote.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.services.interfaces.AdminUserManagementService;
import smolyanVote.smolyanVote.services.mappers.AdminUserManagementMapper;
import smolyanVote.smolyanVote.viewsAndDTO.AdminUserViewDTO;
import smolyanVote.smolyanVote.viewsAndDTO.UserBanAndRolesHistoryDto;

import java.util.Collections;
import java.util.List;
import java.util.Map;

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
        AdminUserViewDTO mappedUser = adminUserManagementMapper.mapUserToAdminView(user);
        return ResponseEntity.ok(mappedUser);
    }

    @PostMapping("/{userId}/ban")
    public ResponseEntity<Map<String, String>> banUser(@PathVariable Long userId, @RequestBody Map<String, Object> request) {
        String reason = (String) request.get("reason");
        String banType = (String) request.get("banType");
        Integer durationDays = (Integer) request.get("durationDays");

        Map<String, String> result = adminUserManagementService.banUser(userId, reason, banType, durationDays);

        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{userId}/unban")
    public ResponseEntity<Map<String, String>> unbanUser(@PathVariable Long userId) {
        Map<String, String> result = adminUserManagementService.unbanUser(userId);

        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{userId}/role")
    public ResponseEntity<Map<String, String>> changeUserRole(@PathVariable Long userId, @RequestBody Map<String, String> request) {
        String newRole = request.get("role");
        String reason = request.get("reason");

        Map<String, String> result = adminUserManagementService.changeUserRole(userId, newRole, reason);

        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable Long userId) {
        Map<String, String> result = adminUserManagementService.deleteUser(userId);

        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/bulk-role-change")
    public ResponseEntity<Map<String, Object>> bulkRoleChange(@RequestBody Map<String, Object> request) {
        @SuppressWarnings("unchecked")
        List<Long> userIds = (List<Long>) request.get("userIds");
        String newRole = (String) request.get("newRole");
        return ResponseEntity.ok(adminUserManagementService.bulkRoleChange(userIds, newRole));
    }

    @PostMapping("/bulk-ban")
    public ResponseEntity<Map<String, Object>> bulkBanUsers(@RequestBody Map<String, Object> request) {
        @SuppressWarnings("unchecked")
        List<Long> userIds = (List<Long>) request.get("userIds");
        String banType = (String) request.get("banType");
        String reason = (String) request.get("reason");
        Integer durationDays = (Integer) request.get("durationDays");
        return ResponseEntity.ok(adminUserManagementService.bulkBanUsers(userIds, banType, reason, durationDays));
    }

    @GetMapping("/history")
    public ResponseEntity<List<UserBanAndRolesHistoryDto>> getUserRoleAndBansHistory() {
        try {
            List<UserBanAndRolesHistoryDto> historyData = adminUserManagementService.getAllHistory();
            return ResponseEntity.ok(historyData);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.emptyList());
        }
    }

    @GetMapping("/{username}/history")
    public ResponseEntity<List<UserBanAndRolesHistoryDto>> getUserSpecificHistory(@PathVariable String username) {
        try {
            List<UserBanAndRolesHistoryDto> historyData = adminUserManagementService.getHistoryForUser(username);
            return ResponseEntity.ok(historyData);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.emptyList());
        }
    }

    @GetMapping("/history/recent")
    public ResponseEntity<List<UserBanAndRolesHistoryDto>> getRecentHistory(@RequestParam(defaultValue = "10") int limit) {
        try {
            List<UserBanAndRolesHistoryDto> historyData = adminUserManagementService.getRecentHistory(limit);
            return ResponseEntity.ok(historyData);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.emptyList());
        }
    }
}