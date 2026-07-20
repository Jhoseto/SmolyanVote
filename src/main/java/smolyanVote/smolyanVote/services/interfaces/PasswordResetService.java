package smolyanVote.smolyanVote.services.interfaces;

import java.util.Optional;

/**
 * Service за възстановяване на забравена парола
 */
public interface PasswordResetService {

    /**
     * Заявява възстановяване на парола за даден имейл.
     *
     * @param email имейл адресът на потребителя
     * @return reset token when a matching user exists and the email was dispatched;
     *         empty when the email is unknown (no enumeration in the HTTP layer)
     */
    Optional<String> requestPasswordReset(String email);

    /**
     * Възстановява паролата с даден токен
     * @param token токенът за възстановяване
     * @param newPassword новата парола
     * @return true ако възстановяването е успешно
     */
    boolean resetPassword(String token, String newPassword);

    /**
     * Изчиства изтеклите токени от базата данни
     */
    void cleanupExpiredTokens();
}
