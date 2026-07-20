package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

import java.util.List;

/** JSON отговор за {@code POST /api/v1/auth/register}. */
public record RegisterResponse(boolean success, String message, List<String> fieldErrors) {

    public static RegisterResponse ok(String message) {
        return new RegisterResponse(true, message, List.of());
    }

    public static RegisterResponse error(String message) {
        return new RegisterResponse(false, message, List.of());
    }

    public static RegisterResponse validationError(String message, List<String> fieldErrors) {
        return new RegisterResponse(false, message, fieldErrors);
    }
}
