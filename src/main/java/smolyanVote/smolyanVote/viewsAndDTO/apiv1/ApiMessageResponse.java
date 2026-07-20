package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

/**
 * Generic success/error ack for JSON API mutations that don't have a more
 * specific response shape (e.g. delete).
 */
public record ApiMessageResponse(boolean success, String message) {

    public static ApiMessageResponse ok(String message) {
        return new ApiMessageResponse(true, message);
    }

    public static ApiMessageResponse error(String message) {
        return new ApiMessageResponse(false, message);
    }
}
