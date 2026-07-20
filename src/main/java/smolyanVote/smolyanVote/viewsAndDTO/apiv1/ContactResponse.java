package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

import java.util.List;

/** JSON отговор за {@code POST /api/v1/contact}. */
public record ContactResponse(boolean success, String message, List<String> fieldErrors) {

    public static ContactResponse ok(String message) {
        return new ContactResponse(true, message, List.of());
    }

    public static ContactResponse error(String message) {
        return new ContactResponse(false, message, List.of());
    }

    public static ContactResponse validationError(String message, List<String> fieldErrors) {
        return new ContactResponse(false, message, fieldErrors);
    }
}
