package smolyanVote.smolyanVote.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.services.interfaces.NotificationService;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.viewsAndDTO.NotificationDTO;

import java.util.List;
import java.util.Map;

/**
 * REST API за нотификации (минимален контролер)
 */
@Controller
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserService userService;

    @Autowired
    public NotificationController(NotificationService notificationService,
                                  UserService userService) {
        this.notificationService = notificationService;
        this.userService = userService;
    }

    /**
     * GET /api/notifications - списък с pagination
     */
    @GetMapping(produces = "application/json")
    @ResponseBody
    public ResponseEntity<Page<NotificationDTO>> getNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth) {

        if (auth == null) return ResponseEntity.status(401).build();

        UserEntity user = userService.getCurrentUser();
        Page<NotificationDTO> notifications = notificationService.getNotifications(
                user, PageRequest.of(page, size)
        );

        return ResponseEntity.ok(notifications);
    }

    /**
     * GET /api/notifications/recent - последни N
     */
    @GetMapping(value = "/recent", produces = "application/json")
    @ResponseBody
    public ResponseEntity<List<NotificationDTO>> getRecent(
            @RequestParam(defaultValue = "10") int limit,
            Authentication auth) {

        if (auth == null) return ResponseEntity.status(401).build();

        UserEntity user = userService.getCurrentUser();
        List<NotificationDTO> notifications = notificationService.getRecent(user, limit);

        return ResponseEntity.ok(notifications);
    }

    /**
     * GET /api/notifications/unread-count
     */
    @GetMapping(value = "/unread-count", produces = "application/json")
    @ResponseBody
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();

        UserEntity user = userService.getCurrentUser();
        long count = notificationService.getUnreadCount(user);

        return ResponseEntity.ok(Map.of("count", count));
    }

    /**
     * PUT /api/notifications/{id}/read
     */
    @PutMapping(value = "/{id}/read", produces = "application/json")
    @ResponseBody
    public ResponseEntity<Void> markAsRead(@PathVariable Long id, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();

        UserEntity user = userService.getCurrentUser();
        notificationService.markAsRead(id, user);

        return ResponseEntity.ok().build();
    }

    /**
     * PUT /api/notifications/read-all
     */
    @PutMapping(value = "/read-all", produces = "application/json")
    @ResponseBody
    public ResponseEntity<Void> markAllAsRead(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();

        UserEntity user = userService.getCurrentUser();
        notificationService.markAllAsRead(user);

        return ResponseEntity.ok().build();
    }

    /**
     * DELETE /api/notifications/{id}
     */
    @DeleteMapping(value = "/{id}", produces = "application/json")
    @ResponseBody
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();

        UserEntity user = userService.getCurrentUser();
        notificationService.delete(id, user);

        return ResponseEntity.ok().build();
    }

    /**
     * DELETE /api/notifications/all
     */
    @DeleteMapping(value = "/all", produces = "application/json")
    @ResponseBody
    public ResponseEntity<Void> deleteAll(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();

        UserEntity user = userService.getCurrentUser();
        notificationService.deleteAll(user);

        return ResponseEntity.ok().build();
    }
}