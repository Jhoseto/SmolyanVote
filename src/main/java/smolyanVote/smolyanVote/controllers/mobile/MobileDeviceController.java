package smolyanVote.smolyanVote.controllers.mobile;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.mobile.MobileDeviceTokenEntity;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.repositories.mobile.MobileDeviceTokenRepository;
import smolyanVote.smolyanVote.viewsAndDTO.mobile.MobileDeviceTokenRequest;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * REST API Controller за Mobile Device Management
 * Управление на device tokens за push notifications
 */
@RestController
@RequestMapping("/api/mobile/device")
@CrossOrigin(origins = "*")
@Slf4j
public class MobileDeviceController {

    private final UserRepository userRepository;
    private final MobileDeviceTokenRepository deviceTokenRepository;

    public MobileDeviceController(
            UserRepository userRepository,
            MobileDeviceTokenRepository deviceTokenRepository) {
        this.userRepository = userRepository;
        this.deviceTokenRepository = deviceTokenRepository;
    }

    /**
     * POST /api/mobile/device/register
     * Регистрира device token за push notifications
     * 
     * Request body: { "deviceToken": "...", "platform": "ios|android", "deviceId": "...", "appVersion": "..." }
     * Response: { "success": true, "message": "Device token registered" }
     */
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> registerDeviceToken(
            @RequestBody @Valid MobileDeviceTokenRequest request,
            Authentication auth) {
        try {
            // Извличане на current user
            UserEntity currentUser = getCurrentUser(auth);
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Не сте автентицирани"));
            }

            // Проверка дали token вече съществува
            Optional<MobileDeviceTokenEntity> existingToken = deviceTokenRepository
                    .findByUserIdAndDeviceToken(currentUser.getId(), request.getDeviceToken());

            if (existingToken.isPresent()) {
                // Актуализиране на съществуващ token
                MobileDeviceTokenEntity token = existingToken.get();
                token.setPlatform(request.getPlatform());
                token.setDeviceId(request.getDeviceId());
                token.setAppVersion(request.getAppVersion());
                token.setLastUsedAt(Instant.now());
                token.setIsActive(true);
                deviceTokenRepository.save(token);

                log.info("Device token updated for user: {}", currentUser.getEmail());
            } else {
                // Създаване на нов token
                MobileDeviceTokenEntity newToken = new MobileDeviceTokenEntity(
                        currentUser,
                        request.getDeviceToken(),
                        request.getPlatform()
                );
                newToken.setDeviceId(request.getDeviceId());
                newToken.setAppVersion(request.getAppVersion());
                deviceTokenRepository.save(newToken);

                log.info("Device token registered for user: {}", currentUser.getEmail());
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Device token registered successfully");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error registering device token", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Грешка при регистрация на device token"));
        }
    }

    /**
     * DELETE /api/mobile/device/unregister
     * Премахва device token (logout или uninstall)
     * 
     * Request body: { "deviceToken": "..." }
     * Response: { "success": true }
     */
    @DeleteMapping("/unregister")
    public ResponseEntity<Map<String, Object>> unregisterDeviceToken(
            @RequestBody Map<String, String> request,
            Authentication auth) {
        try {
            UserEntity currentUser = getCurrentUser(auth);
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Не сте автентицирани"));
            }

            String deviceToken = request.get("deviceToken");
            if (deviceToken == null || deviceToken.isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(createErrorResponse("Device token е задължителен"));
            }

            // Деактивиране на token
            Optional<MobileDeviceTokenEntity> tokenOptional = deviceTokenRepository
                    .findByUserIdAndDeviceToken(currentUser.getId(), deviceToken);

            if (tokenOptional.isPresent()) {
                MobileDeviceTokenEntity token = tokenOptional.get();
                token.setIsActive(false);
                deviceTokenRepository.save(token);

                log.info("Device token unregistered for user: {}", currentUser.getEmail());
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error unregistering device token", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Грешка при премахване на device token"));
        }
    }

    /**
     * Helper method за извличане на current user
     */
    private UserEntity getCurrentUser(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }

        Object principal = auth.getPrincipal();
        if (principal instanceof UserEntity) {
            return (UserEntity) principal;
        }

        // Ако principal е String (email от JWT), зареждаме user
        String identifier = auth.getName();
        return userRepository.findByEmail(identifier.toLowerCase().trim())
                .orElse(null);
    }

    /**
     * Helper method за създаване на error response
     */
    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> error = new HashMap<>();
        error.put("success", false);
        error.put("error", message);
        return error;
    }
}

