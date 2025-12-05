package smolyanVote.smolyanVote.services.serviceImpl;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import smolyanVote.smolyanVote.models.PasswordResetTokenEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.ActivityActionEnum;
import smolyanVote.smolyanVote.models.enums.ActivityTypeEnum;
import smolyanVote.smolyanVote.repositories.PasswordResetTokenRepository;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.interfaces.ActivityLogService;
import smolyanVote.smolyanVote.services.interfaces.EmailService;
import smolyanVote.smolyanVote.services.interfaces.PasswordResetService;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class PasswordResetServiceImpl implements PasswordResetService {

    private final PasswordResetTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final ActivityLogService activityLogService;

    public PasswordResetServiceImpl(PasswordResetTokenRepository tokenRepository,
                                   UserRepository userRepository,
                                   PasswordEncoder passwordEncoder,
                                   EmailService emailService,
                                   ActivityLogService activityLogService) {
        this.tokenRepository = tokenRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.activityLogService = activityLogService;
    }

    @Transactional
    public void requestPasswordReset(String email) {
        // Нормализиране на email на малки букви преди търсене
        String normalizedEmail = email != null ? email.toLowerCase().trim() : null;
        Optional<UserEntity> userOpt = userRepository.findByEmail(normalizedEmail);
        if (userOpt.isEmpty()) {
            return; // Не разкриваме дали имейлът съществува
        }

        UserEntity user = userOpt.get();
        
        // Изтриваме стари токени за този потребител
        tokenRepository.findByUserIdAndNotUsedAndNotExpired(user.getId(), Instant.now())
                .ifPresent(token -> tokenRepository.delete(token));

        // Създаваме нов токен
        String token = UUID.randomUUID().toString();
        Instant expiresAt = Instant.now().plusSeconds(24 * 60 * 60); // 24 часа

        PasswordResetTokenEntity resetToken = new PasswordResetTokenEntity(user, token, expiresAt);
        tokenRepository.save(resetToken);

        // Изпращаме имейл
        emailService.sendPasswordResetEmail(user.getEmail(), token);
    }

    @Transactional
    public boolean resetPassword(String token, String newPassword) {
        Optional<PasswordResetTokenEntity> tokenOpt = tokenRepository
                .findByTokenAndNotUsedAndNotExpired(token, Instant.now());

        if (tokenOpt.isEmpty()) {
            return false;
        }

        PasswordResetTokenEntity resetToken = tokenOpt.get();
        UserEntity user = resetToken.getUser();

        // Обновяваме паролата
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Маркираме токена като използван
        resetToken.setUsed(true);
        tokenRepository.save(resetToken);

        // ✅ ЛОГИРАНЕ НА USER_PASSWORD_RESET
        try {
            String ipAddress = extractIpAddress();
            String userAgent = extractUserAgent();
            String details = "Password reset completed successfully";
            activityLogService.logActivity(ActivityActionEnum.USER_PASSWORD_RESET, user,
                    ActivityTypeEnum.USER.name(), user.getId(), details, ipAddress, userAgent);
        } catch (Exception e) {
            System.err.println("Failed to log USER_PASSWORD_RESET activity: " + e.getMessage());
        }

        return true;
    }

    // ===== HELPER METHODS FOR ACTIVITY LOGGING =====

    private String extractIpAddress() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                if (request != null) {
                    String ip = request.getHeader("X-Forwarded-For");
                    if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
                        ip = request.getHeader("X-Real-IP");
                    }
                    if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
                        ip = request.getRemoteAddr();
                    }
                    if (ip != null && ip.contains(",")) {
                        ip = ip.split(",")[0].trim();
                    }
                    return ip != null ? ip : "unknown";
                }
            }
        } catch (Exception e) {
            // Ignore
        }
        return "unknown";
    }

    private String extractUserAgent() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                if (request != null) {
                    String userAgent = request.getHeader("User-Agent");
                    return userAgent != null ? userAgent : "unknown";
                }
            }
        } catch (Exception e) {
            // Ignore
        }
        return "unknown";
    }

    @Transactional
    public void cleanupExpiredTokens() {
        tokenRepository.deleteExpiredTokens(Instant.now());
    }
}
