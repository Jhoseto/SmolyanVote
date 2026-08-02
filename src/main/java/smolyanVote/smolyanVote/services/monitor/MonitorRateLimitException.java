package smolyanVote.smolyanVote.services.monitor;

/** External API returned HTTP 429 — caller should stop the batch and retry later. */
public class MonitorRateLimitException extends RuntimeException {

    private final String service;
    private final long retryAfterMs;

    public MonitorRateLimitException(String service, long retryAfterMs, String message) {
        super(message);
        this.service = service;
        this.retryAfterMs = retryAfterMs;
    }

    public String service() {
        return service;
    }

    public long retryAfterMs() {
        return retryAfterMs;
    }

    public static boolean isRateLimitMessage(String message) {
        if (message == null) {
            return false;
        }
        return message.contains("429") || message.contains("Too Many Requests") || message.contains("RESOURCE_EXHAUSTED");
    }
}
