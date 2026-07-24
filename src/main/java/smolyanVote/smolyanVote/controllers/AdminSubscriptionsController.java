package smolyanVote.smolyanVote.controllers;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import smolyanVote.smolyanVote.models.EmailSubscriptionEntity;
import smolyanVote.smolyanVote.models.enums.SubscriptionType;
import smolyanVote.smolyanVote.repositories.EmailSubscriptionRepository;
import smolyanVote.smolyanVote.services.interfaces.SubscriptionService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/subscriptions")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSubscriptionsController {

    private final SubscriptionService subscriptionService;
    private final EmailSubscriptionRepository emailSubscriptionRepository;

    public AdminSubscriptionsController(
            SubscriptionService subscriptionService,
            EmailSubscriptionRepository emailSubscriptionRepository) {
        this.subscriptionService = subscriptionService;
        this.emailSubscriptionRepository = emailSubscriptionRepository;
    }

    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> statistics() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalSubscribers", subscriptionService.getTotalSubscribersCount());
        subscriptionService.getSubscriptionStats().forEach((type, count) ->
                stats.put(type.name(), count));
        return ResponseEntity.ok(stats);
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "true") boolean activeOnly) {

        Page<EmailSubscriptionEntity> subscriptions = emailSubscriptionRepository.findAll(
                PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 200)));

        List<Map<String, Object>> rows = subscriptions.getContent().stream()
                .filter(s -> !activeOnly || s.isActive())
                .filter(s -> type == null || type.isBlank() || s.getType().name().equalsIgnoreCase(type))
                .map(s -> {
                    Map<String, Object> row = new HashMap<>();
                    row.put("id", s.getId());
                    row.put("username", s.getUser() != null ? s.getUser().getUsername() : null);
                    row.put("email", s.getUserEmail() != null ? s.getUserEmail()
                            : (s.getUser() != null ? s.getUser().getEmail() : null));
                    row.put("type", s.getType().name());
                    row.put("active", s.isActive());
                    row.put("subscribedAt", s.getSubscribedAt());
                    return row;
                })
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("subscriptions", rows);
        response.put("page", subscriptions.getNumber());
        response.put("size", subscriptions.getSize());
        response.put("totalElements", subscriptions.getTotalElements());
        response.put("totalPages", subscriptions.getTotalPages());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/export")
    @Transactional(readOnly = true)
    public ResponseEntity<String> export(@RequestParam(required = false) String type) {
        List<EmailSubscriptionEntity> all = emailSubscriptionRepository.findAll();
        StringBuilder csv = new StringBuilder("username,email,type,active,subscribedAt\n");
        for (EmailSubscriptionEntity s : all) {
            if (type != null && !type.isBlank() && !s.getType().name().equalsIgnoreCase(type)) {
                continue;
            }
            if (!s.isActive()) {
                continue;
            }
            csv.append(csvCell(s.getUser() != null ? s.getUser().getUsername() : "")).append(',')
                    .append(csvCell(s.getUserEmail() != null ? s.getUserEmail()
                            : (s.getUser() != null ? s.getUser().getEmail() : ""))).append(',')
                    .append(s.getType().name()).append(',')
                    .append(s.isActive()).append(',')
                    .append(s.getSubscribedAt()).append('\n');
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=subscriptions.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv.toString());
    }

    private static String csvCell(String value) {
        if (value == null) {
            return "";
        }
        String escaped = value.replace("\"", "\"\"");
        return "\"" + escaped + "\"";
    }
}
