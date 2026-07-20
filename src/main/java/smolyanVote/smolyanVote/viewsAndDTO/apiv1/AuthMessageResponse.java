package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Общ JSON отговор (success + message) за прости auth действия без
 * допълнителни данни: {@code /forgot-password}, {@code /reset-password},
 * {@code /confirm}.
 *
 * {@code devResetLink} is set only on the {@code dev} profile so local testing
 * works even when mailbox providers block {@code localhost} links in email.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AuthMessageResponse(boolean success, String message, String devResetLink) {

    public static AuthMessageResponse ok(String message) {
        return new AuthMessageResponse(true, message, null);
    }

    public static AuthMessageResponse okWithDevResetLink(String message, String devResetLink) {
        return new AuthMessageResponse(true, message, devResetLink);
    }

    public static AuthMessageResponse error(String message) {
        return new AuthMessageResponse(false, message, null);
    }
}
