package smolyanVote.smolyanVote.controllers.apiv1;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import smolyanVote.smolyanVote.componentsAndSecurity.OAuth2AuthenticationSuccessHandler;
import smolyanVote.smolyanVote.config.FrontendProperties;
import smolyanVote.smolyanVote.services.interfaces.PasswordResetService;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.viewsAndDTO.UserRegistrationViewModel;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.*;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * Тънък JSON контролер за автентикация, ползван от новия Next.js frontend
 * (JWT-only). Login/refresh/logout остават на {@code /api/mobile/auth/**} —
 * тук живеят само действията, за които няма съществуващ JSON endpoint:
 * регистрация, забравена/нулиране на парола, потвърждение на имейл и
 * стартиране на web OAuth. Бизнес логиката остава в {@link UserService} /
 * {@link PasswordResetService} — същите services, ползвани и от v1
 * Thymeleaf контролерите.
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    /** Паритет с v1 {@code RegisterController}: формата не може да е попълнена за < 5 сек. */
    private static final long MIN_REGISTER_SUBMIT_DELAY_MS = 5000;

    private static final Set<String> OAUTH_PROVIDERS = Set.of("google", "facebook");

    private final UserService userService;
    private final PasswordResetService passwordResetService;
    private final FrontendProperties frontendProperties;
    private final Environment environment;

    public AuthController(
            UserService userService,
            PasswordResetService passwordResetService,
            FrontendProperties frontendProperties,
            Environment environment) {
        this.userService = userService;
        this.passwordResetService = passwordResetService;
        this.frontendProperties = frontendProperties;
        this.environment = environment;
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        if (request.middleName() != null && !request.middleName().isBlank()) {
            logger.warn("Honeypot triggered: possible bot registration from {}", request.email());
            return ResponseEntity.badRequest().body(RegisterResponse.error("Невалидна заявка."));
        }

        if (request.formRenderedAt() != null) {
            long elapsed = System.currentTimeMillis() - request.formRenderedAt();
            if (elapsed < MIN_REGISTER_SUBMIT_DELAY_MS) {
                logger.warn("Registration form submitted too quickly: {} ms", elapsed);
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                        .body(RegisterResponse.error("Подозрително попълване. Опитайте отново."));
            }
        }

        if (!request.password().equals(request.confirmPassword())) {
            return ResponseEntity.badRequest().body(RegisterResponse.error("Паролите не съвпадат."));
        }

        UserRegistrationViewModel viewModel = new UserRegistrationViewModel()
                .setUsername(request.username())
                .setEmail(request.email())
                .setRegPassword(request.password())
                .setConfirmPassword(request.confirmPassword());

        try {
            userService.createNewUser(viewModel);
            return ResponseEntity.ok(RegisterResponse.ok(
                    "Регистрацията е успешна! Моля проверете вашия имейл за активация. Погледнете и спам папката."));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(RegisterResponse.error(e.getMessage()));
        } catch (Exception e) {
            logger.error("Error during registration for {}: {}", request.email(), e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(RegisterResponse.error(
                            "Регистрацията не завърши: имейлът за активация не беше изпратен. Моля, опитайте отново."));
        }
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<RegisterResponse> handleValidation(MethodArgumentNotValidException ex) {
        List<String> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .toList();
        return ResponseEntity.badRequest()
                .body(RegisterResponse.validationError("Моля, попълнете всички полета коректно.", fieldErrors));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<AuthMessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        String genericMessage =
                "Ако имейлът съществува в системата, ще получите линк за възстановяване на парола.";
        Optional<String> resetToken = Optional.empty();
        try {
            resetToken = passwordResetService.requestPasswordReset(request.email());
        } catch (Exception e) {
            // Client still gets a generic OK (no email enumeration), but log the full cause —
            // Mailjet HTTPS often fails locally under AV SSL scanning (PKIX) and was silent before.
            logger.error("Error requesting password reset for {}: {}", request.email(), e.getMessage(), e);
        }

        // Prod: never reveal whether the email exists.
        // Dev: also return the localhost reset link — mail providers often block localhost URLs.
        if (resetToken.isPresent() && environment.matchesProfiles("dev")) {
            String devLink = frontendProperties.origin() + "/reset-password?token=" + resetToken.get();
            logger.info("DEV password-reset link: {}", devLink);
            return ResponseEntity.ok(AuthMessageResponse.okWithDevResetLink(genericMessage, devLink));
        }

        return ResponseEntity.ok(AuthMessageResponse.ok(genericMessage));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<AuthMessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        if (!request.password().equals(request.confirmPassword())) {
            return ResponseEntity.badRequest().body(AuthMessageResponse.error("Паролите не съвпадат."));
        }
        if (request.password().length() < 6) {
            return ResponseEntity.badRequest()
                    .body(AuthMessageResponse.error("Паролата трябва да бъде поне 6 символа."));
        }

        try {
            boolean success = passwordResetService.resetPassword(request.token(), request.password());
            if (success) {
                return ResponseEntity.ok(AuthMessageResponse.ok(
                        "Паролата е успешно обновена. Можете да влезете в системата."));
            }
            return ResponseEntity.badRequest().body(AuthMessageResponse.error(
                    "Невалиден или изтекъл токен. Моля, заявете нов линк за възстановяване."));
        } catch (Exception e) {
            logger.error("Error resetting password: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(AuthMessageResponse.error("Възникна грешка при обновяване на паролата. Моля, опитайте отново."));
        }
    }

    @GetMapping("/confirm")
    public ResponseEntity<AuthMessageResponse> confirm(@RequestParam("userId") Long userId,
                                                        @RequestParam("code") String code) {
        boolean confirmed = userService.confirmEmail(userId, code);
        if (confirmed) {
            return ResponseEntity.ok(AuthMessageResponse.ok(
                    "Вашият имейл е потвърден! Можете да влезете във вашия профил."));
        }
        return ResponseEntity.badRequest().body(AuthMessageResponse.error(
                "Невалиден код или акаунтът вече е активиран."));
    }

    /**
     * Стартира Google/Facebook OAuth за web (Next.js) frontend-а.
     * Маркерите (cookie + session) са auxiliary — success handler-ът вече
     * винаги връща JWT към {@code /oauth-callback} за browser OAuth.
     */
    @GetMapping("/oauth/start")
    public void startOAuth(
            @RequestParam String provider,
            HttpServletRequest request,
            HttpServletResponse response) throws IOException {
        String normalized = provider == null ? "" : provider.trim().toLowerCase();
        if (!OAUTH_PROVIDERS.contains(normalized)) {
            response.sendRedirect(frontendProperties.originForOAuth(request)
                    + "/oauth-callback?error=unsupported_provider");
            return;
        }

        request.getSession(true).setAttribute(OAuth2AuthenticationSuccessHandler.WEB_OAUTH_SESSION_ATTR, Boolean.TRUE);
        request.getSession(true).setAttribute(
                OAuth2AuthenticationSuccessHandler.WEB_OAUTH_RETURN_ORIGIN,
                frontendProperties.originForOAuth(request));

        Cookie cookie = new Cookie(OAuth2AuthenticationSuccessHandler.WEB_OAUTH_COOKIE, "true");
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        cookie.setMaxAge(300);
        response.addCookie(cookie);

        response.sendRedirect("/oauth2/authorization/" + normalized);
    }
}
