package smolyanVote.smolyanVote.controllers.mobile;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVUserMinimalDTO;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * REST API Controller за Mobile Profile Management
 * Управление на профил от мобилното приложение
 */
@RestController
@RequestMapping("/api/mobile/profile")
@CrossOrigin(origins = "*") // За development; production: конкретни домейни
@Slf4j
public class MobileProfileController {

    private final UserService userService;
    private final UserRepository userRepository;

    public MobileProfileController(
            UserService userService,
            UserRepository userRepository) {
        this.userService = userService;
        this.userRepository = userRepository;
    }

    /**
     * PUT /api/mobile/profile/update
     * Обновява профил на потребителя (снимка и bio)
     * Използва същия service метод като web версията за да не счупи нищо
     * 
     * Request: multipart/form-data
     *   - profileImage: MultipartFile (optional)
     *   - bio: String (optional)
     * 
     * Response: { "success": true, "user": {...}, "message": "Профилът е обновен успешно" }
     */
    @PutMapping("/update")
    public ResponseEntity<Map<String, Object>> updateProfile(
            @RequestParam(value = "profileImage", required = false) MultipartFile profileImage,
            @RequestParam(value = "bio", required = false) String bio,
            Authentication auth) {
        
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("Необходима е автентикация"));
        }

        try {
            // Get current user
            UserEntity currentUser = getCurrentUser(auth);
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Потребителят не е намерен"));
            }

            // Валидация: поне едно поле трябва да се обнови
            // Ако и двете са празни или null, не правим нищо
            boolean hasImage = profileImage != null && !profileImage.isEmpty();
            boolean hasBio = bio != null && !bio.trim().isEmpty();
            
            if (!hasImage && !hasBio) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(createErrorResponse("Трябва да се обнови поне едно поле (снимка или bio)"));
            }

            // Използваме същия service метод като web версията
            // Това гарантира че imageUrl се обновява правилно и се използва навсякъде в SmolyanVote
            userService.updateUserProfile(
                currentUser.getId(), 
                profileImage != null && !profileImage.isEmpty() ? profileImage : null,
                bio != null && !bio.trim().isEmpty() ? bio : null,
                null // Location не се обновява от mobile (само снимка и bio)
            );

            // Reload user за да получим обновените данни
            Optional<UserEntity> updatedUserOptional = userRepository.findById(currentUser.getId());
            if (updatedUserOptional.isEmpty()) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(createErrorResponse("Грешка при зареждане на обновените данни"));
            }

            UserEntity updatedUser = updatedUserOptional.get();
            SVUserMinimalDTO userDTO = SVUserMinimalDTO.Mapper.toDTO(updatedUser);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("user", userDTO);
            response.put("message", "Профилът е обновен успешно");

            log.info("Mobile profile updated successfully for user: {}", currentUser.getEmail());
            return ResponseEntity.ok(response);

        } catch (IOException e) {
            log.error("Error updating mobile profile - IO error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Грешка при обработка на снимката"));
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request for mobile profile update: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Error updating mobile profile", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Грешка при обновяване на профила"));
        }
    }

    /**
     * GET /api/mobile/profile
     * Връща текущия профил на потребителя
     * 
     * Response: { "user": {...} }
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getProfile(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("Необходима е автентикация"));
        }

        try {
            UserEntity currentUser = getCurrentUser(auth);
            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Потребителят не е намерен"));
            }

            SVUserMinimalDTO userDTO = SVUserMinimalDTO.Mapper.toDTO(currentUser);

            Map<String, Object> response = new HashMap<>();
            response.put("user", userDTO);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error getting mobile profile", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Грешка при зареждане на профила"));
        }
    }

    /**
     * Извлича current user от Authentication
     * Works with both traditional authentication, OAuth2 authentication, and JWT authentication.
     */
    private UserEntity getCurrentUser(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }
        
        // Проверка дали Principal е вече UserEntity (от JWT filter)
        if (auth.getPrincipal() instanceof UserEntity) {
            return (UserEntity) auth.getPrincipal();
        }
        
        String identifier = null;
        
        // Проверка за OAuth2User (Google/Facebook login)
        if (auth.getPrincipal() instanceof org.springframework.security.oauth2.core.user.OAuth2User) {
            org.springframework.security.oauth2.core.user.OAuth2User oAuth2User = 
                (org.springframework.security.oauth2.core.user.OAuth2User) auth.getPrincipal();
            // За OAuth2, извличаме email от атрибутите
            identifier = oAuth2User.getAttribute("email");
        } else {
            // За традиционна автентикация, използваме getName() (което е email)
            identifier = auth.getName();
        }
        
        if (identifier == null || identifier.isEmpty()) {
            return null;
        }
        
        // Нормализиране на email на малки букви
        String normalizedIdentifier = identifier.toLowerCase().trim();
        
        // Load user от database - първо по email, после по username
        return userRepository.findByEmail(normalizedIdentifier)
                .or(() -> userRepository.findByUsername(normalizedIdentifier))
                .orElse(null);
    }

    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("error", message);
        return response;
    }
}

