package smolyanVote.smolyanVote.services.interfaces;

/**
 * Service за възстановяване на забравена парола
 */
public interface PasswordResetService {

    /**
     * Заявява възстановяване на парола за даден имейл
     * @param email имейл адресът на потребителя
     */
    void requestPasswordReset(String email);

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
