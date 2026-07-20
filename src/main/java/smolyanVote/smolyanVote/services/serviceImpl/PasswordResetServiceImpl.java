package smolyanVote.smolyanVote.services.serviceImpl;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
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

    private static final Logger log = LoggerFactory.getLogger(PasswordResetServiceImpl.class);

    private final PasswordResetTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final ActivityLogService activityLogService;
    private final TransactionTemplate transactionTemplate;

    public PasswordResetServiceImpl(PasswordResetTokenRepository tokenRepository,
                                   UserRepository userRepository,
                                   PasswordEncoder passwordEncoder,
                                   EmailService emailService,
                                   ActivityLogService activityLogService,
                                   PlatformTransactionManager transactionManager) {
        this.tokenRepository = tokenRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.activityLogService = activityLogService;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    /**
     * DB work commits first; Mailjet is called only after commit so a send failure
     * is not hidden inside a rolled-back transaction (and AuthController can log it).
     */
    @Override
    public Optional<String> requestPasswordReset(String email) {
        String normalizedEmail = email != null ? email.toLowerCase().trim() : null;

        ResetMailJob job = transactionTemplate.execute(status -> {
            Optional<UserEntity> userOpt = userRepository.findByEmail(normalizedEmail);
            if (userOpt.isEmpty()) {
                return null;
            }

            UserEntity user = userOpt.get();
            tokenRepository.findByUserIdAndNotUsedAndNotExpired(user.getId(), Instant.now())
                    .ifPresent(tokenRepository::delete);

            String token = UUID.randomUUID().toString();
            Instant expiresAt = Instant.now().plusSeconds(24 * 60 * 60);
            tokenRepository.save(new PasswordResetTokenEntity(user, token, expiresAt));
            return new ResetMailJob(user.getId(), user.getEmail(), token);
        });

        if (job == null) {
            log.info("Password reset requested for unknown email (no mail sent)");
            return Optional.empty();
        }

        emailService.sendPasswordResetEmail(job.email(), job.token());
        log.info("Password reset email dispatched for userId={}", job.userId());
        return Optional.of(job.token());
    }

    @Transactional
    public boolean resetPassword(String token, String newPassword) {
        String normalizedToken = token == null ? "" : token.trim();
        if (normalizedToken.isEmpty()) {
            return false;
        }

        Optional<PasswordResetTokenEntity> tokenOpt = tokenRepository
                .findByTokenAndNotUsedAndNotExpired(normalizedToken, Instant.now());

        if (tokenOpt.isEmpty()) {
            return false;
        }

        PasswordResetTokenEntity resetToken = tokenOpt.get();
        UserEntity user = resetToken.getUser();

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        resetToken.setUsed(true);
        tokenRepository.save(resetToken);

        try {
            String ipAddress = extractIpAddress();
            String userAgent = extractUserAgent();
            String details = "Password reset completed successfully";
            activityLogService.logActivity(ActivityActionEnum.USER_PASSWORD_RESET, user,
                    ActivityTypeEnum.USER.name(), user.getId(), details, ipAddress, userAgent);
        } catch (Exception e) {
            log.warn("Failed to log USER_PASSWORD_RESET activity: {}", e.getMessage());
        }

        return true;
    }

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

    private record ResetMailJob(long userId, String email, String token) {}
}
