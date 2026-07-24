package smolyanVote.smolyanVote.controllers;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import smolyanVote.smolyanVote.models.enums.EventType;
import smolyanVote.smolyanVote.models.enums.ReportableEntityType;
import smolyanVote.smolyanVote.services.interfaces.MainEventsService;
import smolyanVote.smolyanVote.services.interfaces.ReportsService;
import smolyanVote.smolyanVote.viewsAndDTO.EventSimpleViewDTO;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.EventsCatalogResponse;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/events")
@PreAuthorize("hasRole('ADMIN')")
public class AdminEventsController {

    private final MainEventsService mainEventsService;
    private final ReportsService reportsService;

    public AdminEventsController(MainEventsService mainEventsService, ReportsService reportsService) {
        this.mainEventsService = mainEventsService;
        this.reportsService = reportsService;
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> listEvents(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "false") boolean reportedOnly) {

        EventsCatalogResponse catalog = mainEventsService.getEventsCatalog(null);
        List<Map<String, Object>> items = new ArrayList<>();

        for (EventSimpleViewDTO event : catalog.events()) {
            String title = event.getTitle() != null ? event.getTitle().toLowerCase() : "";
            if (search != null && !search.isBlank() && !title.contains(search.trim().toLowerCase())) {
                continue;
            }

            EventType eventType = event.getEventType();
            ReportableEntityType entityType = toReportableType(eventType);
            long reportCount = reportsService.getReportsCountForEntity(entityType, event.getId());
            if (reportedOnly && reportCount == 0) {
                continue;
            }

            Map<String, Object> row = new HashMap<>();
            row.put("id", event.getId());
            row.put("type", eventType != null ? eventType.name() : "SIMPLE_EVENT");
            row.put("title", event.getTitle());
            row.put("creatorName", event.getCreatorName());
            row.put("createdAt", event.getCreatedAt());
            row.put("status", event.getEventStatus() != null ? event.getEventStatus().name() : null);
            row.put("reportCount", reportCount);
            row.put("editPath", editPath(eventType, event.getId()));
            items.add(row);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("events", items);
        response.put("total", items.size());
        return ResponseEntity.ok(response);
    }

    private ReportableEntityType toReportableType(EventType eventType) {
        if (eventType == null) {
            return ReportableEntityType.SIMPLE_EVENT;
        }
        return switch (eventType) {
            case REFERENDUM -> ReportableEntityType.REFERENDUM;
            case MULTI_POLL -> ReportableEntityType.MULTI_POLL;
            default -> ReportableEntityType.SIMPLE_EVENT;
        };
    }

    private String editPath(EventType type, Long id) {
        if (type == EventType.REFERENDUM) {
            return "/referendum/" + id + "/edit";
        }
        if (type == EventType.MULTI_POLL) {
            return "/multipoll/" + id + "/edit";
        }
        return "/event/" + id + "/edit";
    }
}
