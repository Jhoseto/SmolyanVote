package smolyanVote.smolyanVote.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.models.SignalsEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.SignalsCategory;
import smolyanVote.smolyanVote.services.interfaces.SignalsService;
import smolyanVote.smolyanVote.services.interfaces.UserService;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/signals")
public class LegacySignalsController {

    private final SignalsService signalsService;
    private final UserService userService;

    @Autowired
    public LegacySignalsController(SignalsService signalsService, UserService userService) {
        this.signalsService = signalsService;
        this.userService = userService;
    }

    // ====== GET ALL SIGNALS ======

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllSignals(
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "") String category,
            @RequestParam(defaultValue = "false") boolean showExpired,
            @RequestParam(defaultValue = "") String sort,
            @RequestParam(defaultValue = "") String time,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {

        try {
            // Ð’Ð°Ð»Ð¸Ð´Ð°Ñ†Ð¸Ñ Ð½Ð° Ð¿Ð°Ñ€Ð°Ð¼ÐµÑ‚Ñ€Ð¸Ñ‚Ðµ
            page = Math.max(0, page);
            size = Math.min(Math.max(1, size), 100);

            Pageable pageable = PageRequest.of(page, size);
            Page<SignalsEntity> signalsPage = signalsService.findWithFilters(
                    search, category, showExpired, time, sort, pageable);

            // ÐšÐ¾Ð½Ð²ÐµÑ€Ñ‚Ð¸Ñ€Ð°Ð½Ðµ ÐºÑŠÐ¼ JSON Ñ„Ð¾Ñ€Ð¼Ð°Ñ‚ Ð·Ð° frontend-Ð°
            List<Map<String, Object>> signalsJson = signalsPage.getContent().stream()
                    .map(this::convertSignalToJson)
                    .toList();

            return ResponseEntity.ok(signalsJson);

        } catch (Exception e) {
            System.err.println("Error getting signals: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(List.of());
        }
    }

    // ====== GET SIGNAL BY ID ======

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getSignalById(@PathVariable Long id, Authentication auth) {
        try {
            SignalsEntity signal = signalsService.findById(id);
            if (signal == null) {
                return ResponseEntity.status(404).body(createErrorResponse("Ð¡Ð¸Ð³Ð½Ð°Ð»ÑŠÑ‚ Ð½Ðµ Ðµ Ð½Ð°Ð¼ÐµÑ€ÐµÐ½"));
            }

            // Increment views
            signalsService.incrementViews(id);
            signal = signalsService.findById(id); // Reload to get updated views

            // Convert to JSON with like status for current user
            Map<String, Object> signalJson = convertSignalToJson(signal);

            // Add isLikedByCurrentUser if user is authenticated
            if (auth != null && auth.isAuthenticated()) {
                UserEntity currentUser = userService.getCurrentUser();
                if (currentUser != null) {
                    boolean isLikedByCurrentUser = signalsService.isLikedByUser(id, currentUser.getUsername());
                    signalJson.put("isLikedByCurrentUser", isLikedByCurrentUser);
                }
            } else {
                signalJson.put("isLikedByCurrentUser", false);
            }

            return ResponseEntity.ok(signalJson);

        } catch (Exception e) {
            System.err.println("Error getting signal: " + e.getMessage());
            return ResponseEntity.status(500).body(createErrorResponse("Ð’ÑŠÐ·Ð½Ð¸ÐºÐ½Ð° Ð³Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð·Ð°Ñ€ÐµÐ¶Ð´Ð°Ð½Ðµ Ð½Ð° ÑÐ¸Ð³Ð½Ð°Ð»Ð°"));
        }
    }

    // ====== GET LIKED SIGNALS BY CURRENT USER ======
    @GetMapping("/liked")
    public ResponseEntity<List<Long>> getLikedSignalsByCurrentUser(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.ok(List.of());
        }

        try {
            UserEntity currentUser = userService.getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.ok(List.of());
            }

            // TODO: Implement method to get all liked signal IDs by user
            List<Long> likedSignalIds = signalsService.getLikedSignalIdsByUser(currentUser.getUsername());

            return ResponseEntity.ok(likedSignalIds);

        } catch (Exception e) {
            System.err.println("Error getting liked signals: " + e.getMessage());
            return ResponseEntity.ok(List.of());
        }
    }

    // ====== CREATE NEW SIGNAL ======

    @PostMapping
    public ResponseEntity<Map<String, Object>> createSignal(
            @RequestParam String title,
            @RequestParam String description,
            @RequestParam String category,
            @RequestParam Integer expirationDays,
            @RequestParam String latitude,
            @RequestParam String longitude,
            @RequestParam(required = false) MultipartFile image,
            Authentication auth) {

        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body(createErrorResponse("ÐÐµÐ¾Ð±Ñ…Ð¾Ð´Ð¸Ð¼Ð° Ðµ Ð°Ð²Ñ‚ÐµÐ½Ñ‚Ð¸ÐºÐ°Ñ†Ð¸Ñ"));
        }

        try {
            // Ð’Ð°Ð»Ð¸Ð´Ð°Ñ†Ð¸Ñ Ð½Ð° Ð²Ñ…Ð¾Ð´Ð½Ð¸Ñ‚Ðµ Ð´Ð°Ð½Ð½Ð¸
            String validationError = validateSignalInput(title, description, category, expirationDays, latitude, longitude);
            if (validationError != null) {
                return ResponseEntity.status(400).body(createErrorResponse(validationError));
            }

            // ÐŸÐ¾Ð»ÑƒÑ‡Ð°Ð²Ð°Ð½Ðµ Ð½Ð° Ñ‚ÐµÐºÑƒÑ‰Ð¸Ñ Ð¿Ð¾Ñ‚Ñ€ÐµÐ±Ð¸Ñ‚ÐµÐ»
            UserEntity currentUser = userService.getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(401).body(createErrorResponse("ÐŸÐ¾Ñ‚Ñ€ÐµÐ±Ð¸Ñ‚ÐµÐ»ÑÑ‚ Ð½Ðµ Ðµ Ð½Ð°Ð¼ÐµÑ€ÐµÐ½"));
            }

            // ÐŸÐ°Ñ€ÑÐ¸Ñ€Ð°Ð½Ðµ Ð½Ð° Ð¿Ð°Ñ€Ð°Ð¼ÐµÑ‚Ñ€Ð¸Ñ‚Ðµ
            SignalsCategory categoryEnum = SignalsCategory.valueOf(category.toUpperCase());
            BigDecimal lat = new BigDecimal(latitude);
            BigDecimal lon = new BigDecimal(longitude);

            // Ð¡ÑŠÐ·Ð´Ð°Ð²Ð°Ð½Ðµ Ð½Ð° ÑÐ¸Ð³Ð½Ð°Ð»Ð°
            SignalsEntity newSignal = signalsService.create(title, description, categoryEnum,
                    expirationDays, lat, lon, image, currentUser);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Ð¡Ð¸Ð³Ð½Ð°Ð»ÑŠÑ‚ Ðµ ÑÑŠÐ·Ð´Ð°Ð´ÐµÐ½ ÑƒÑÐ¿ÐµÑˆÐ½Ð¾");
            response.put("signal", convertSignalToJson(newSignal));

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(createErrorResponse("ÐÐµÐ²Ð°Ð»Ð¸Ð´Ð½Ð¸ Ð´Ð°Ð½Ð½Ð¸: " + e.getMessage()));
        } catch (Exception e) {
            System.err.println("Error creating signal: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(createErrorResponse("Ð’ÑŠÐ·Ð½Ð¸ÐºÐ½Ð° Ð³Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ ÑÑŠÐ·Ð´Ð°Ð²Ð°Ð½Ðµ Ð½Ð° ÑÐ¸Ð³Ð½Ð°Ð»Ð°"));
        }
    }

    // ====== UPDATE SIGNAL ======

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateSignal(
            @PathVariable Long id,
            @RequestParam String title,
            @RequestParam String description,
            @RequestParam String category,
            @RequestParam Integer expirationDays,
            @RequestParam(required = false) MultipartFile image,
            Authentication auth) {

        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body(createErrorResponse("ÐÐµÐ¾Ð±Ñ…Ð¾Ð´Ð¸Ð¼Ð° Ðµ Ð°Ð²Ñ‚ÐµÐ½Ñ‚Ð¸ÐºÐ°Ñ†Ð¸Ñ"));
        }

        try {
            SignalsEntity signal = signalsService.findById(id);
            if (signal == null) {
                return ResponseEntity.status(404).body(createErrorResponse("Ð¡Ð¸Ð³Ð½Ð°Ð»ÑŠÑ‚ Ð½Ðµ Ðµ Ð½Ð°Ð¼ÐµÑ€ÐµÐ½"));
            }

            // ÐŸÑ€Ð¾Ð²ÐµÑ€ÐºÐ° Ð½Ð° Ð¿Ñ€Ð°Ð²Ð°Ñ‚Ð°
            if (!signalsService.canEditSignal(signal, auth)) {
                return ResponseEntity.status(403).body(createErrorResponse("ÐÑÐ¼Ð°Ñ‚Ðµ Ð¿Ñ€Ð°Ð²Ð° Ð·Ð° Ñ€ÐµÐ´Ð°ÐºÑ‚Ð¸Ñ€Ð°Ð½Ðµ Ð½Ð° Ñ‚Ð¾Ð·Ð¸ ÑÐ¸Ð³Ð½Ð°Ð»"));
            }

            // Ð’Ð°Ð»Ð¸Ð´Ð°Ñ†Ð¸Ñ
            String validationError = validateSignalUpdateInput(title, description, category, expirationDays);
            if (validationError != null) {
                return ResponseEntity.status(400).body(createErrorResponse(validationError));
            }

            // ÐŸÐ°Ñ€ÑÐ¸Ñ€Ð°Ð½Ðµ Ð½Ð° Ð¿Ð°Ñ€Ð°Ð¼ÐµÑ‚Ñ€Ð¸Ñ‚Ðµ
            SignalsCategory categoryEnum = SignalsCategory.valueOf(category.toUpperCase());

            // ÐžÐ±Ð½Ð¾Ð²ÑÐ²Ð°Ð½Ðµ Ð½Ð° ÑÐ¸Ð³Ð½Ð°Ð»Ð°
            SignalsEntity updatedSignal = signalsService.update(signal, title, description,
                    categoryEnum, expirationDays, image);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Ð¡Ð¸Ð³Ð½Ð°Ð»ÑŠÑ‚ Ðµ Ð¾Ð±Ð½Ð¾Ð²ÐµÐ½ ÑƒÑÐ¿ÐµÑˆÐ½Ð¾");
            response.put("signal", convertSignalToJson(updatedSignal));

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(createErrorResponse("ÐÐµÐ²Ð°Ð»Ð¸Ð´Ð½Ð¸ Ð´Ð°Ð½Ð½Ð¸: " + e.getMessage()));
        } catch (Exception e) {
            System.err.println("Error updating signal: " + e.getMessage());
            return ResponseEntity.status(500).body(createErrorResponse("Ð’ÑŠÐ·Ð½Ð¸ÐºÐ½Ð° Ð³Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð¾Ð±Ð½Ð¾Ð²ÑÐ²Ð°Ð½Ðµ Ð½Ð° ÑÐ¸Ð³Ð½Ð°Ð»Ð°"));
        }
    }

    // ====== DELETE SIGNAL ======

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteSignal(@PathVariable Long id, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body(createErrorResponse("ÐÐµÐ¾Ð±Ñ…Ð¾Ð´Ð¸Ð¼Ð° Ðµ Ð°Ð²Ñ‚ÐµÐ½Ñ‚Ð¸ÐºÐ°Ñ†Ð¸Ñ"));
        }

        try {
            SignalsEntity signal = signalsService.findById(id);
            if (signal == null) {
                return ResponseEntity.status(404).body(createErrorResponse("Ð¡Ð¸Ð³Ð½Ð°Ð»ÑŠÑ‚ Ð½Ðµ Ðµ Ð½Ð°Ð¼ÐµÑ€ÐµÐ½"));
            }

            if (!signalsService.canDeleteSignal(signal, auth)) {
                return ResponseEntity.status(403).body(createErrorResponse("ÐÑÐ¼Ð°Ñ‚Ðµ Ð¿Ñ€Ð°Ð²Ð° Ð·Ð° Ð¸Ð·Ñ‚Ñ€Ð¸Ð²Ð°Ð½Ðµ Ð½Ð° Ñ‚Ð¾Ð·Ð¸ ÑÐ¸Ð³Ð½Ð°Ð»"));
            }

            signalsService.delete(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Ð¡Ð¸Ð³Ð½Ð°Ð»ÑŠÑ‚ Ðµ Ð¸Ð·Ñ‚Ñ€Ð¸Ñ‚ ÑƒÑÐ¿ÐµÑˆÐ½Ð¾");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Error deleting signal: " + e.getMessage());
            return ResponseEntity.status(500).body(createErrorResponse("Ð’ÑŠÐ·Ð½Ð¸ÐºÐ½Ð° Ð³Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð¸Ð·Ñ‚Ñ€Ð¸Ð²Ð°Ð½Ðµ Ð½Ð° ÑÐ¸Ð³Ð½Ð°Ð»Ð°"));
        }
    }

    // ====== LIKE SIGNAL ======

    @PostMapping("/{id}/like")
    public ResponseEntity<Map<String, Object>> toggleLike(@PathVariable Long id, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body(createErrorResponse("ÐÐµÐ¾Ð±Ñ…Ð¾Ð´Ð¸Ð¼Ð° Ðµ Ð°Ð²Ñ‚ÐµÐ½Ñ‚Ð¸ÐºÐ°Ñ†Ð¸Ñ"));
        }

        try {
            UserEntity currentUser = userService.getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(401).body(createErrorResponse("ÐŸÐ¾Ñ‚Ñ€ÐµÐ±Ð¸Ñ‚ÐµÐ»ÑÑ‚ Ð½Ðµ Ðµ Ð½Ð°Ð¼ÐµÑ€ÐµÐ½"));
            }

            boolean isNowLiked = signalsService.toggleLike(id, currentUser);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("liked", isNowLiked);
            response.put("message", isNowLiked ?
                    "Ð¡Ð¸Ð³Ð½Ð°Ð»ÑŠÑ‚ Ðµ Ñ…Ð°Ñ€ÐµÑÐ°Ð½" : "Ð¥Ð°Ñ€ÐµÑÐ²Ð°Ð½ÐµÑ‚Ð¾ Ðµ Ð¿Ñ€ÐµÐ¼Ð°Ñ…Ð½Ð°Ñ‚Ð¾");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Error toggling like: " + e.getMessage());
            return ResponseEntity.status(500).body(createErrorResponse("Ð’ÑŠÐ·Ð½Ð¸ÐºÐ½Ð° Ð³Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ñ…Ð°Ñ€ÐµÑÐ²Ð°Ð½Ðµ"));
        }
    }

    // ====== HELPER METHODS ======

    private Map<String, Object> convertSignalToJson(SignalsEntity signal) {
        Map<String, Object> signalMap = new HashMap<>();

        // ÐžÑÐ½Ð¾Ð²Ð½Ð¸ Ð´Ð°Ð½Ð½Ð¸
        signalMap.put("id", signal.getId());
        signalMap.put("title", signal.getTitle());
        signalMap.put("description", signal.getDescription());
        signalMap.put("category", signal.getCategory().name());
        signalMap.put("expirationDays", signal.getExpirationDays());
        signalMap.put("activeUntil", signal.getActiveUntil());
        signalMap.put("isActive", signal.isActive());

        // ÐšÐ¾Ð¾Ñ€Ð´Ð¸Ð½Ð°Ñ‚Ð¸ ÐºÐ°Ñ‚Ð¾ array [lat, lng]
        if (signal.getLatitude() != null && signal.getLongitude() != null) {
            signalMap.put("coordinates", new double[]{
                    signal.getLatitude().doubleValue(),
                    signal.getLongitude().doubleValue()
            });
        }

        // Ð˜Ð·Ð¾Ð±Ñ€Ð°Ð¶ÐµÐ½Ð¸Ðµ
        signalMap.put("imageUrl", signal.getImageUrl());

        // ÐÐ²Ñ‚Ð¾Ñ€ Ð¸Ð½Ñ„Ð¾Ñ€Ð¼Ð°Ñ†Ð¸Ñ
        Map<String, Object> authorMap = new HashMap<>();
        if (signal.getAuthor() != null) {
            authorMap.put("id", signal.getAuthor().getId());
            authorMap.put("username", signal.getAuthor().getUsername());
            authorMap.put("imageUrl", signal.getAuthor().getImageUrl());
        }
        signalMap.put("author", authorMap);

        // Ð’Ñ€ÐµÐ¼ÐµÐ²Ð¸ Ð´Ð°Ð½Ð½Ð¸
        signalMap.put("createdAt", signal.getCreated());
        signalMap.put("modifiedAt", signal.getModified());

        // Ð¡Ñ‚Ð°Ñ‚Ð¸ÑÑ‚Ð¸ÐºÐ¸
        signalMap.put("likesCount", signal.getLikesCount() != null ? signal.getLikesCount() : 0);
        signalMap.put("viewsCount", signal.getViewsCount() != null ? signal.getViewsCount() : 0);

        return signalMap;
    }

    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> errorMap = new HashMap<>();
        errorMap.put("error", true);
        errorMap.put("message", message);
        return errorMap;
    }



    private String validateSignalInput(String title, String description, String category,
                                       Integer expirationDays, String latitude, String longitude) {
        if (title == null || title.trim().length() < 5) {
            return "Ð—Ð°Ð³Ð»Ð°Ð²Ð¸ÐµÑ‚Ð¾ Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ Ð¿Ð¾Ð½Ðµ 5 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð°";
        }
        if (title.length() > 200) {
            return "Ð—Ð°Ð³Ð»Ð°Ð²Ð¸ÐµÑ‚Ð¾ Ð½Ðµ Ð¼Ð¾Ð¶Ðµ Ð´Ð° Ðµ Ð¿Ð¾Ð²ÐµÑ‡Ðµ Ð¾Ñ‚ 200 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð°";
        }
        if (description == null || description.trim().length() < 10) {
            return "ÐžÐ¿Ð¸ÑÐ°Ð½Ð¸ÐµÑ‚Ð¾ Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ Ð¿Ð¾Ð½Ðµ 10 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð°";
        }
        if (description.length() > 2000) {
            return "ÐžÐ¿Ð¸ÑÐ°Ð½Ð¸ÐµÑ‚Ð¾ Ð½Ðµ Ð¼Ð¾Ð¶Ðµ Ð´Ð° Ðµ Ð¿Ð¾Ð²ÐµÑ‡Ðµ Ð¾Ñ‚ 2000 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð°";
        }

        try {
            SignalsCategory.valueOf(category.toUpperCase());
        } catch (Exception e) {
            return "ÐÐµÐ²Ð°Ð»Ð¸Ð´Ð½Ð° ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ñ";
        }

        if (expirationDays == null || expirationDays < 1 || expirationDays > 7) {
            return "ÐŸÐµÑ€Ð¸Ð¾Ð´ÑŠÑ‚ Ð½Ð° Ð°ÐºÑ‚Ð¸Ð²Ð½Ð¾ÑÑ‚ Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ Ð¼ÐµÐ¶Ð´Ñƒ 1 Ð¸ 7 Ð´Ð½Ð¸";
        }
        if (expirationDays != 1 && expirationDays != 3 && expirationDays != 7) {
            return "ÐŸÐµÑ€Ð¸Ð¾Ð´ÑŠÑ‚ Ð½Ð° Ð°ÐºÑ‚Ð¸Ð²Ð½Ð¾ÑÑ‚ Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ 1, 3 Ð¸Ð»Ð¸ 7 Ð´Ð½Ð¸";
        }

        try {
            BigDecimal lat = new BigDecimal(latitude);
            BigDecimal lon = new BigDecimal(longitude);
            if (lat.doubleValue() < -90 || lat.doubleValue() > 90) {
                return "ÐÐµÐ²Ð°Ð»Ð¸Ð´Ð½Ð° Ð³ÐµÐ¾Ð³Ñ€Ð°Ñ„ÑÐºÐ° ÑˆÐ¸Ñ€Ð¸Ð½Ð°";
            }
            if (lon.doubleValue() < -180 || lon.doubleValue() > 180) {
                return "ÐÐµÐ²Ð°Ð»Ð¸Ð´Ð½Ð° Ð³ÐµÐ¾Ð³Ñ€Ð°Ñ„ÑÐºÐ° Ð´ÑŠÐ»Ð¶Ð¸Ð½Ð°";
            }
            
            // ÐŸÑ€Ð¾Ð²ÐµÑ€ÐºÐ° Ð´Ð°Ð»Ð¸ ÐºÐ¾Ð¾Ñ€Ð´Ð¸Ð½Ð°Ñ‚Ð¸Ñ‚Ðµ ÑÐ° Ð² Ð³Ñ€Ð°Ð½Ð¸Ñ†Ð¸Ñ‚Ðµ Ð½Ð° Ð¾Ð±Ð»Ð°ÑÑ‚ Ð¡Ð¼Ð¾Ð»ÑÐ½
            // ÐÐºÑ‚ÑƒÐ°Ð»Ð¸Ð·Ð¸Ñ€Ð°Ð½Ð¸ Ð³Ñ€Ð°Ð½Ð¸Ñ†Ð¸: lat: 41.336 - 41.926, lng: 24.318 - 25.168
            double latValue = lat.doubleValue();
            double lonValue = lon.doubleValue();
            if (latValue < 41.336 || latValue > 41.926 || lonValue < 24.318 || lonValue > 25.168) {
                return "ÐœÐµÑÑ‚Ð¾Ð¿Ð¾Ð»Ð¾Ð¶ÐµÐ½Ð¸ÐµÑ‚Ð¾ Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ Ð² Ð³Ñ€Ð°Ð½Ð¸Ñ†Ð¸Ñ‚Ðµ Ð½Ð° Ð¾Ð±Ð»Ð°ÑÑ‚ Ð¡Ð¼Ð¾Ð»ÑÐ½";
            }
        } catch (Exception e) {
            return "ÐÐµÐ²Ð°Ð»Ð¸Ð´Ð½Ð¸ ÐºÐ¾Ð¾Ñ€Ð´Ð¸Ð½Ð°Ñ‚Ð¸";
        }

        return null;
    }

    private String validateSignalUpdateInput(String title, String description, String category, Integer expirationDays) {
        return validateSignalInput(title, description, category, expirationDays, "0", "0");
    }
}