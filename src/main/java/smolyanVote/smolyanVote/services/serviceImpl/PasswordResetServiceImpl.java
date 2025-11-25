package smolyanVote.smolyanVote.services.serviceImpl;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.PasswordResetTokenEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.repositories.PasswordResetTokenRepository;
import smolyanVote.smolyanVote.repositories.UserRepository;
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

    public PasswordResetServiceImpl(PasswordResetTokenRepository tokenRepository,
                                   UserRepository userRepository,
                                   PasswordEncoder passwordEncoder,
                                   EmailService emailService) {
        this.tokenRepository = tokenRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
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

        return true;
    }

    @Transactional
    public void cleanupExpiredTokens() {
        tokenRepository.deleteExpiredTokens(Instant.now());
    }
}
