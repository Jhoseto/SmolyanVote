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
public class SignalsController {

    private final SignalsService signalsService;
    private final UserService userService;

    @Autowired
    public SignalsController(SignalsService signalsService, UserService userService) {
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
            // Валидация на параметрите
            page = Math.max(0, page);
            size = Math.min(Math.max(1, size), 100);

            Pageable pageable = PageRequest.of(page, size);
            Page<SignalsEntity> signalsPage = signalsService.findWithFilters(
                    search, category, showExpired, time, sort, pageable);

            // Конвертиране към JSON формат за frontend-а
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
                return ResponseEntity.status(404).body(createErrorResponse("Сигналът не е намерен"));
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
            return ResponseEntity.status(500).body(createErrorResponse("Възникна грешка при зареждане на сигнала"));
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
            return ResponseEntity.status(401).body(createErrorResponse("Необходима е автентикация"));
        }

        try {
            // Валидация на входните данни
            String validationError = validateSignalInput(title, description, category, expirationDays, latitude, longitude);
            if (validationError != null) {
                return ResponseEntity.status(400).body(createErrorResponse(validationError));
            }

            // Получаване на текущия потребител
            UserEntity currentUser = userService.getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(401).body(createErrorResponse("Потребителят не е намерен"));
            }

            // Парсиране на параметрите
            SignalsCategory categoryEnum = SignalsCategory.valueOf(category.toUpperCase());
            BigDecimal lat = new BigDecimal(latitude);
            BigDecimal lon = new BigDecimal(longitude);

            // Създаване на сигнала
            SignalsEntity newSignal = signalsService.create(title, description, categoryEnum,
                    expirationDays, lat, lon, image, currentUser);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Сигналът е създаден успешно");
            response.put("signal", convertSignalToJson(newSignal));

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(createErrorResponse("Невалидни данни: " + e.getMessage()));
        } catch (Exception e) {
            System.err.println("Error creating signal: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(createErrorResponse("Възникна грешка при създаване на сигнала"));
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
            return ResponseEntity.status(401).body(createErrorResponse("Необходима е автентикация"));
        }

        try {
            SignalsEntity signal = signalsService.findById(id);
            if (signal == null) {
                return ResponseEntity.status(404).body(createErrorResponse("Сигналът не е намерен"));
            }

            // Проверка на правата
            if (!signalsService.canEditSignal(signal, auth)) {
                return ResponseEntity.status(403).body(createErrorResponse("Нямате права за редактиране на този сигнал"));
            }

            // Валидация
            String validationError = validateSignalUpdateInput(title, description, category, expirationDays);
            if (validationError != null) {
                return ResponseEntity.status(400).body(createErrorResponse(validationError));
            }

            // Парсиране на параметрите
            SignalsCategory categoryEnum = SignalsCategory.valueOf(category.toUpperCase());

            // Обновяване на сигнала
            SignalsEntity updatedSignal = signalsService.update(signal, title, description,
                    categoryEnum, expirationDays, image);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Сигналът е обновен успешно");
            response.put("signal", convertSignalToJson(updatedSignal));

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(createErrorResponse("Невалидни данни: " + e.getMessage()));
        } catch (Exception e) {
            System.err.println("Error updating signal: " + e.getMessage());
            return ResponseEntity.status(500).body(createErrorResponse("Възникна грешка при обновяване на сигнала"));
        }
    }

    // ====== DELETE SIGNAL ======

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteSignal(@PathVariable Long id, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body(createErrorResponse("Необходима е автентикация"));
        }

        try {
            SignalsEntity signal = signalsService.findById(id);
            if (signal == null) {
                return ResponseEntity.status(404).body(createErrorResponse("Сигналът не е намерен"));
            }

            if (!signalsService.canDeleteSignal(signal, auth)) {
                return ResponseEntity.status(403).body(createErrorResponse("Нямате права за изтриване на този сигнал"));
            }

            signalsService.delete(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Сигналът е изтрит успешно");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Error deleting signal: " + e.getMessage());
            return ResponseEntity.status(500).body(createErrorResponse("Възникна грешка при изтриване на сигнала"));
        }
    }

    // ====== LIKE SIGNAL ======

    @PostMapping("/{id}/like")
    public ResponseEntity<Map<String, Object>> toggleLike(@PathVariable Long id, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).body(createErrorResponse("Необходима е автентикация"));
        }

        try {
            UserEntity currentUser = userService.getCurrentUser();
            if (currentUser == null) {
                return ResponseEntity.status(401).body(createErrorResponse("Потребителят не е намерен"));
            }

            boolean isNowLiked = signalsService.toggleLike(id, currentUser);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("liked", isNowLiked);
            response.put("message", isNowLiked ?
                    "Сигналът е харесан" : "Харесването е премахнато");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("Error toggling like: " + e.getMessage());
            return ResponseEntity.status(500).body(createErrorResponse("Възникна грешка при харесване"));
        }
    }

    // ====== HELPER METHODS ======

    private Map<String, Object> convertSignalToJson(SignalsEntity signal) {
        Map<String, Object> signalMap = new HashMap<>();

        // Основни данни
        signalMap.put("id", signal.getId());
        signalMap.put("title", signal.getTitle());
        signalMap.put("description", signal.getDescription());
        signalMap.put("category", signal.getCategory().name());
        signalMap.put("expirationDays", signal.getExpirationDays());
        signalMap.put("activeUntil", signal.getActiveUntil());
        signalMap.put("isActive", signal.isActive());

        // Координати като array [lat, lng]
        if (signal.getLatitude() != null && signal.getLongitude() != null) {
            signalMap.put("coordinates", new double[]{
                    signal.getLatitude().doubleValue(),
                    signal.getLongitude().doubleValue()
            });
        }

        // Изображение
        signalMap.put("imageUrl", signal.getImageUrl());

        // Автор информация
        Map<String, Object> authorMap = new HashMap<>();
        if (signal.getAuthor() != null) {
            authorMap.put("id", signal.getAuthor().getId());
            authorMap.put("username", signal.getAuthor().getUsername());
            authorMap.put("imageUrl", signal.getAuthor().getImageUrl());
        }
        signalMap.put("author", authorMap);

        // Времеви данни
        signalMap.put("createdAt", signal.getCreated());
        signalMap.put("modifiedAt", signal.getModified());

        // Статистики
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
            return "Заглавието трябва да е поне 5 символа";
        }
        if (title.length() > 200) {
            return "Заглавието не може да е повече от 200 символа";
        }
        if (description == null || description.trim().length() < 10) {
            return "Описанието трябва да е поне 10 символа";
        }
        if (description.length() > 2000) {
            return "Описанието не може да е повече от 2000 символа";
        }

        try {
            SignalsCategory.valueOf(category.toUpperCase());
        } catch (Exception e) {
            return "Невалидна категория";
        }

        if (expirationDays == null || expirationDays < 1 || expirationDays > 7) {
            return "Периодът на активност трябва да е между 1 и 7 дни";
        }
        if (expirationDays != 1 && expirationDays != 3 && expirationDays != 7) {
            return "Периодът на активност трябва да е 1, 3 или 7 дни";
        }

        try {
            BigDecimal lat = new BigDecimal(latitude);
            BigDecimal lon = new BigDecimal(longitude);
            if (lat.doubleValue() < -90 || lat.doubleValue() > 90) {
                return "Невалидна географска ширина";
            }
            if (lon.doubleValue() < -180 || lon.doubleValue() > 180) {
                return "Невалидна географска дължина";
            }
        } catch (Exception e) {
            return "Невалидни координати";
        }

        return null;
    }

    private String validateSignalUpdateInput(String title, String description, String category, Integer expirationDays) {
        return validateSignalInput(title, description, category, expirationDays, "0", "0");
    }
}