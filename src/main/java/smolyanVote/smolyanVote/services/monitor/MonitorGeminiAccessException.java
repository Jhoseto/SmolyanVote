package smolyanVote.smolyanVote.services.monitor;

/** Gemini API key or project access permanently rejected — do not retry in batch loops. */
public class MonitorGeminiAccessException extends RuntimeException {

    private final int statusCode;

    public MonitorGeminiAccessException(int statusCode, String message) {
        super(message);
        this.statusCode = statusCode;
    }

    public int statusCode() {
        return statusCode;
    }

    public static boolean isAccessDeniedMessage(String message) {
        if (message == null) {
            return false;
        }
        return message.contains("403")
                || message.contains("401")
                || message.contains("PERMISSION_DENIED")
                || message.contains("denied access")
                || message.contains("API key not valid");
    }
}
