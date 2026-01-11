package smolyanVote.smolyanVote.controllers.mobile;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.UserStatusEnum;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.services.jwt.JwtTokenService;
import smolyanVote.smolyanVote.viewsAndDTO.mobile.MobileLoginRequest;
import smolyanVote.smolyanVote.viewsAndDTO.mobile.MobileLoginResponse;
import smolyanVote.smolyanVote.viewsAndDTO.mobile.MobileRefreshTokenRequest;
import smolyanVote.smolyanVote.viewsAndDTO.mobile.MobileOAuthRequest;
import smolyanVote.smolyanVote.viewsAndDTO.svmessenger.SVUserMinimalDTO;
import smolyanVote.smolyanVote.models.enums.AuthProvider;
import smolyanVote.smolyanVote.services.mobile.MobileOAuthService;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * REST API Controller за Mobile Authentication
 * JWT-based authentication за мобилни приложения
 */
@RestController
@RequestMapping("/api/mobile/auth")
@Slf4j
public class MobileAuthController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final UserRepository userRepository;
    private final JwtTokenService jwtTokenService;
    private final MobileOAuthService mobileOAuthService;

    public MobileAuthController(
            AuthenticationManager authenticationManager,
            UserService userService,
            UserRepository userRepository,
            JwtTokenService jwtTokenService,
            MobileOAuthService mobileOAuthService) {
        this.authenticationManager = authenticationManager;
        this.userService = userService;
        this.userRepository = userRepository;
        this.jwtTokenService = jwtTokenService;
        this.mobileOAuthService = mobileOAuthService;
    }

    /**
     * POST /api/mobile/auth/login
     * Mobile login endpoint - връща JWT tokens
     * 
     * Request body: { "email": "user@example.com", "password": "password123" }
     * Response: { "accessToken": "...", "refreshToken": "...", "user": {...} }
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody @Valid MobileLoginRequest request) {
        try {
            // Нормализиране на email
            String normalizedEmail = request.getEmail().toLowerCase().trim();

            // Намери user
            Optional<UserEntity> userOptional = userService.findUserByEmail(normalizedEmail);
            if (userOptional.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Невалиден email или парола"));
            }

            UserEntity user = userOptional.get();

            // Проверка за account lockout
            if (user.getAccountLockedUntil() != null && user.getAccountLockedUntil().isAfter(Instant.now())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(createErrorResponse("Акаунтът е временно заключен поради множество неуспешни опити за вход. Опитайте отново след: " + user.getAccountLockedUntil()));
            }

            // Проверка за статус
            if (user.getStatus().equals(UserStatusEnum.PENDING_ACTIVATION)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(createErrorResponse("Акаунтът не е активиран. Моля, активирайте го чрез изпратения имейл."));
            }

            // Проверка за бан
            if (user.getBanEndDate() != null && user.getBanEndDate().isAfter(Instant.now())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(createErrorResponse("Акаунтът е блокиран до: " + user.getBanEndDate()));
            }

            // Аутентикация
            try {
                Authentication authentication = authenticationManager.authenticate(
                        new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword())
                );

                SecurityContextHolder.getContext().setAuthentication(authentication);

                // Успешен login - reset failed attempts и unlock account
                user.setFailedLoginAttempts(0);
                user.setAccountLockedUntil(null);

                // Обновяване на online status
                user.setLastOnline(Instant.now());
                user.setOnlineStatus(1);
                userRepository.save(user);

                // Генериране на tokens
                String accessToken = jwtTokenService.generateAccessToken(user);
                String refreshToken = jwtTokenService.generateRefreshToken(user);

                // User DTO
                SVUserMinimalDTO userDTO = SVUserMinimalDTO.Mapper.toDTO(user);

                // Response
                MobileLoginResponse response = MobileLoginResponse.builder()
                        .accessToken(accessToken)
                        .refreshToken(refreshToken)
                        .tokenType("Bearer")
                        .expiresIn(3600L) // 1 час в секунди
                        .user(userDTO)
                        .build();

                log.info("Mobile login successful for user: {}", normalizedEmail);
                return ResponseEntity.ok(response);

            } catch (BadCredentialsException e) {
                log.warn("Mobile login failed - invalid credentials for: {}", normalizedEmail);
                
                // Увеличаване на failed login attempts
                int failedAttempts = user.getFailedLoginAttempts() + 1;
                user.setFailedLoginAttempts(failedAttempts);
                
                // Account lockout след 5 неуспешни опита за 30 минути
                if (failedAttempts >= 5) {
                    Instant lockUntil = Instant.now().plusSeconds(30 * 60); // 30 минути
                    user.setAccountLockedUntil(lockUntil);
                    log.warn("Account locked for user: {} until: {}", normalizedEmail, lockUntil);
                }
                
                userRepository.save(user);
                
                String errorMessage = failedAttempts >= 5 
                    ? "Акаунтът е временно заключен поради множество неуспешни опити. Опитайте отново след 30 минути."
                    : "Невалиден email или парола. Остават " + (5 - failedAttempts) + " опита преди заключване.";
                
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse(errorMessage));
            }

        } catch (Exception e) {
            log.error("Error during mobile login", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Вътрешна грешка. Моля, опитайте отново."));
        }
    }

    /**
     * POST /api/mobile/auth/refresh
     * Refresh access token с refresh token
     * 
     * Request body: { "refreshToken": "..." }
     * Response: { "accessToken": "...", "refreshToken": "...", "expiresIn": 3600 }
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestBody @Valid MobileRefreshTokenRequest request) {
        try {
            String refreshToken = request.getRefreshToken();

            // Валидация на refresh token
            if (!jwtTokenService.validateToken(refreshToken)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Невалиден refresh token"));
            }

            if (!jwtTokenService.isRefreshToken(refreshToken)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Token не е refresh token"));
            }

            if (jwtTokenService.isTokenExpired(refreshToken)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Refresh token е изтекъл. Моля, влезте отново."));
            }

            // Извличане на user email
            String email = jwtTokenService.extractEmail(refreshToken);
            Optional<UserEntity> userOptional = userService.findUserByEmail(email);

            if (userOptional.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Потребителят не е намерен"));
            }

            UserEntity user = userOptional.get();

            // Проверка за статус
            if (user.getStatus().equals(UserStatusEnum.PENDING_ACTIVATION)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(createErrorResponse("Акаунтът не е активиран"));
            }

            // Генериране на нови tokens
            String newAccessToken = jwtTokenService.generateAccessToken(user);
            String newRefreshToken = jwtTokenService.generateRefreshToken(user);

            Map<String, Object> response = new HashMap<>();
            response.put("accessToken", newAccessToken);
            response.put("refreshToken", newRefreshToken);
            response.put("tokenType", "Bearer");
            response.put("expiresIn", 3600L);

            log.info("Token refreshed successfully for user: {}", email);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error refreshing token", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Вътрешна грешка при обновяване на token"));
        }
    }

    /**
     * POST /api/mobile/auth/logout
     * Logout endpoint (client трябва да изтрие tokens)
     * 
     * Response: { "success": true, "message": "Успешно излизане" }
     */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout() {
        try {
            // В production може да се добави token blacklist
            // За сега просто връщаме success - client трябва да изтрие tokens

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Успешно излизане");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error during logout", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Грешка при излизане");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * POST /api/mobile/auth/oauth
     * OAuth login endpoint за Google и Facebook
     * 
     * Request body: { "provider": "google|facebook", "idToken": "..." (за Google) или "accessToken": "..." (за Facebook) }
     * Response: { "accessToken": "...", "refreshToken": "...", "user": {...} }
     */
    @PostMapping("/oauth")
    public ResponseEntity<?> oauthLogin(@RequestBody @Valid MobileOAuthRequest request) {
        try {
            String provider = request.getProvider().toLowerCase();
            Map<String, Object> userInfo;

            // Валидация на token според provider
            if ("google".equals(provider)) {
                if (request.getIdToken() == null || request.getIdToken().isEmpty()) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(createErrorResponse("Google ID token е задължителен"));
                }
                userInfo = mobileOAuthService.validateGoogleToken(request.getIdToken());
            } else if ("facebook".equals(provider)) {
                if (request.getAccessToken() == null || request.getAccessToken().isEmpty()) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(createErrorResponse("Facebook access token е задължителен"));
                }
                userInfo = mobileOAuthService.validateFacebookToken(request.getAccessToken());
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(createErrorResponse("Неподдържан OAuth provider. Използвайте 'google' или 'facebook'"));
            }

            // Създаване или обновяване на user
            AuthProvider authProvider = "google".equals(provider) ? AuthProvider.GOOGLE : AuthProvider.FACEBOOK;
            UserEntity user = mobileOAuthService.processOAuthUser(userInfo, authProvider);

            // Проверка за статус
            if (user.getStatus().equals(UserStatusEnum.PENDING_ACTIVATION)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(createErrorResponse("Акаунтът не е активиран"));
            }

            // Проверка за бан
            if (user.getBanEndDate() != null && user.getBanEndDate().isAfter(Instant.now())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(createErrorResponse("Акаунтът е блокиран до: " + user.getBanEndDate()));
            }

            // Генериране на JWT tokens
            String accessToken = jwtTokenService.generateAccessToken(user);
            String refreshToken = jwtTokenService.generateRefreshToken(user);

            // User DTO
            SVUserMinimalDTO userDTO = SVUserMinimalDTO.Mapper.toDTO(user);

            // Response
            MobileLoginResponse response = MobileLoginResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .tokenType("Bearer")
                    .expiresIn(3600L)
                    .user(userDTO)
                    .build();

            log.info("Mobile OAuth login successful for user: {} via {}", user.getEmail(), provider);
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            log.warn("Mobile OAuth login failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Error during mobile OAuth login", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Вътрешна грешка. Моля, опитайте отново."));
        }
    }

    /**
     * Helper method за създаване на error response
     */
    private Map<String, String> createErrorResponse(String message) {
        Map<String, String> error = new HashMap<>();
        error.put("error", message);
        return error;
    }
}

