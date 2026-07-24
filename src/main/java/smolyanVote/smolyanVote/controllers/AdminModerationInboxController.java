package smolyanVote.smolyanVote.controllers;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.ReportableEntityType;
import smolyanVote.smolyanVote.services.interfaces.AdminContentActionService;
import smolyanVote.smolyanVote.services.interfaces.ReportsService;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.viewsAndDTO.GroupedReportsDTO;
import smolyanVote.smolyanVote.viewsAndDTO.ModerationInboxItemDTO;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/moderation")
@PreAuthorize("hasRole('ADMIN')")
public class AdminModerationInboxController {

    private final ReportsService reportsService;
    private final AdminContentActionService adminContentActionService;
    private final UserService userService;

    public AdminModerationInboxController(
            ReportsService reportsService,
            AdminContentActionService adminContentActionService,
            UserService userService) {
        this.reportsService = reportsService;
        this.adminContentActionService = adminContentActionService;
        this.userService = userService;
    }

    @GetMapping(value = "/inbox", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> inbox(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String entityType,
            @RequestParam(defaultValue = "false") boolean pendingOnly,
            @RequestParam(required = false) String status) {

        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100));
        ReportableEntityType typeFilter = parseEntityType(entityType);
        Page<GroupedReportsDTO> grouped = reportsService.getGroupedReportsFiltered(
                pageable, typeFilter, pendingOnly, status);

        List<ModerationInboxItemDTO> items = new ArrayList<>();
        for (GroupedReportsDTO dto : grouped.getContent()) {
            ModerationInboxItemDTO item = new ModerationInboxItemDTO();
            item.setEntityType(dto.getEntityType());
            item.setEntityId(dto.getEntityId());
            item.setEntityLabel(dto.getEntityLabel());
            item.setReportCount(dto.getReportCount());
            item.setStatus(dto.getStatus());
            item.setLastReportDate(dto.getLastReportDate());
            item.setReportIds(dto.getReportIds());
            item.setPreview(dto.getMostRecentDescription());
            Long authorId = adminContentActionService.resolveAuthorId(dto.getEntityType(), dto.getEntityId());
            item.setAuthorId(authorId);
            items.add(item);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("items", items);
        response.put("page", grouped.getNumber());
        response.put("size", grouped.getSize());
        response.put("totalElements", grouped.getTotalElements());
        response.put("totalPages", grouped.getTotalPages());
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/entity-action", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> entityAction(@RequestBody Map<String, Object> body) {
        UserEntity admin = userService.getCurrentUser();
        if (admin == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Необходима е автентикация"));
        }

        String entityTypeStr = (String) body.get("entityType");
        Long entityId = Long.valueOf(body.get("entityId").toString());
        String action = (String) body.getOrDefault("action", "DELETE");
        String adminNotes = (String) body.get("adminNotes");
        boolean banAuthor = Boolean.TRUE.equals(body.get("banAuthor"));
        String banReason = (String) body.get("banReason");

        ReportableEntityType entityType = ReportableEntityType.valueOf(entityTypeStr.toUpperCase());
        Map<String, Object> result = adminContentActionService.takeActionOnEntity(
                entityType, entityId, admin, action, adminNotes, banAuthor, banReason);
        return ResponseEntity.ok(result);
    }

    private ReportableEntityType parseEntityType(String entityType) {
        if (entityType == null || entityType.isBlank() || "ALL".equalsIgnoreCase(entityType)) {
            return null;
        }
        return ReportableEntityType.valueOf(entityType.toUpperCase());
    }
}
