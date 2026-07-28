package smolyanVote.smolyanVote.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.UserRole;
import smolyanVote.smolyanVote.models.enums.UserStatusEnum;
import smolyanVote.smolyanVote.services.interfaces.AdminUserManagementService;
import smolyanVote.smolyanVote.services.mappers.AdminUserManagementMapper;
import smolyanVote.smolyanVote.viewsAndDTO.AdminUserViewDTO;
import smolyanVote.smolyanVote.viewsAndDTO.UserBanAndRolesHistoryDto;

import java.util.Collections;
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
    public ResponseEntity<Map<String, Object>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) UserStatusEnum status,
            @RequestParam(required = false) Integer minStrikes) {
        int safeSize = Math.min(Math.max(size, 1), 100);
        Page<AdminUserViewDTO> usersPage = adminUserManagementService.getUsersPage(
                search, role, status, minStrikes, PageRequest.of(Math.max(page, 0), safeSize));
        return ResponseEntity.ok(Map.of(
                "users", usersPage.getContent(),
                "totalCount", usersPage.getTotalElements(),
                "page", usersPage.getNumber(),
                "size", usersPage.getSize(),
                "totalPages", usersPage.getTotalPages()));
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
        Integer durationDays = parseOptionalInteger(request.get("durationDays"));
        Integer durationHours = parseOptionalInteger(request.get("durationHours"));

        Map<String, String> result = adminUserManagementService.banUser(userId, reason, banType, durationDays, durationHours);

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

    @PostMapping("/{userId}/password")
    public ResponseEntity<Map<String, String>> changeUserPassword(@PathVariable Long userId, @RequestBody Map<String, String> request) {
        String password = request.get("password");
        String confirmPassword = request.get("confirmPassword");
        String reason = request.get("reason");

        Map<String, String> result = adminUserManagementService.changeUserPassword(
                userId, password, confirmPassword, reason);

        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{userId}/activate")
    public ResponseEntity<Map<String, String>> activateUser(@PathVariable Long userId) {
        Map<String, String> result = adminUserManagementService.activateUser(userId);

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

    @PostMapping("/{userId}/reset-strikes")
    public ResponseEntity<Map<String, String>> resetModerationStrikes(@PathVariable Long userId) {
        Map<String, String> result = adminUserManagementService.resetModerationStrikes(userId);
        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/strikes/statistics")
    public ResponseEntity<Map<String, Object>> strikeStatistics() {
        return ResponseEntity.ok(adminUserManagementService.getStrikeStatistics());
    }

    @PostMapping("/strikes/bulk-reset")
    public ResponseEntity<Map<String, Object>> bulkResetStrikes(@RequestBody Map<String, Object> request) {
        @SuppressWarnings("unchecked")
        List<Object> userIdObjects = (List<Object>) request.get("userIds");
        List<Long> userIds = userIdObjects.stream()
                .map(obj -> Long.valueOf(obj.toString()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(adminUserManagementService.bulkResetModerationStrikes(userIds));
    }

    @PostMapping("/bulk-delete")
    public ResponseEntity<Map<String, Object>> bulkDeleteUsers(@RequestBody Map<String, Object> request) {
        @SuppressWarnings("unchecked")
        List<Object> userIdObjects = (List<Object>) request.get("userIds");
        List<Long> userIds = userIdObjects.stream()
                .map(obj -> Long.valueOf(obj.toString()))
                .collect(Collectors.toList());
        Map<String, Object> result = adminUserManagementService.bulkDeleteUsers(userIds);
        if (errorCountOnly(result)) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    private static boolean errorCountOnly(Map<String, Object> result) {
        int errorCount = ((Number) result.getOrDefault("errorCount", 0)).intValue();
        int successCount = ((Number) result.getOrDefault("successCount", 0)).intValue();
        return errorCount > 0 && successCount == 0;
    }

    @GetMapping("/export")
    public ResponseEntity<String> exportUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) UserStatusEnum status,
            @RequestParam(required = false) Integer minStrikes) {
        String csv = adminUserManagementService.exportUsersCsv(search, role, status, minStrikes);
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=users.csv")
                .contentType(org.springframework.http.MediaType.parseMediaType("text/csv"))
                .body(csv);
    }

    @PostMapping("/bulk-role-change")
    public ResponseEntity<Map<String, Object>> bulkRoleChange(@RequestBody Map<String, Object> request) {
        @SuppressWarnings("unchecked")
        List<Object> userIdObjects = (List<Object>) request.get("userIds");
        List<Long> userIds = userIdObjects.stream()
                .map(obj -> Long.valueOf(obj.toString()))
                .collect(Collectors.toList());
        String newRole = (String) request.get("newRole");
        return ResponseEntity.ok(adminUserManagementService.bulkRoleChange(userIds, newRole));
    }

    @PostMapping("/bulk-ban")
    public ResponseEntity<Map<String, Object>> bulkBanUsers(@RequestBody Map<String, Object> request) {
        @SuppressWarnings("unchecked")
        List<Object> userIdObjects = (List<Object>) request.get("userIds");
        List<Long> userIds = userIdObjects.stream()
                .map(obj -> Long.valueOf(obj.toString()))
                .collect(Collectors.toList());
        String banType = (String) request.get("banType");
        String reason = (String) request.get("reason");
        Integer durationDays = parseOptionalInteger(request.get("durationDays"));
        Integer durationHours = parseOptionalInteger(request.get("durationHours"));
        Map<String, Object> result = adminUserManagementService.bulkBanUsers(userIds, banType, reason, durationDays, durationHours);
        if (result.containsKey("errorCount") && ((Number) result.get("errorCount")).intValue() > 0
                && ((Number) result.get("successCount")).intValue() == 0) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/bulk-activate")
    public ResponseEntity<Map<String, Object>> bulkActivateUsers(@RequestBody Map<String, Object> request) {
        @SuppressWarnings("unchecked")
        List<Object> userIdObjects = (List<Object>) request.get("userIds");
        List<Long> userIds = userIdObjects.stream()
                .map(obj -> Long.valueOf(obj.toString()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(adminUserManagementService.bulkActivateUsers(userIds));
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

    private static Integer parseOptionalInteger(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.intValue();
        }
        return Integer.valueOf(value.toString());
    }
}