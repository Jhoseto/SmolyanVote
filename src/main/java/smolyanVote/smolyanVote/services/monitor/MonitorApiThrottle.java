package smolyanVote.smolyanVote.services.monitor;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Shared pacing for free-tier / rate-limited external APIs. */
final class MonitorApiThrottle {

    private static final Pattern RETRY_DELAY_SECONDS =
            Pattern.compile("\"retryDelay\"\\s*:\\s*\"(\\d+)s\"");

    private final long minIntervalMs;
    private long lastCallAtMs;

    MonitorApiThrottle(long minIntervalMs) {
        this.minIntervalMs = Math.max(0, minIntervalMs);
    }

    void awaitSlot() {
        if (minIntervalMs <= 0) {
            return;
        }
        synchronized (this) {
            long elapsed = System.currentTimeMillis() - lastCallAtMs;
            long wait = minIntervalMs - elapsed;
            if (wait > 0) {
                sleepQuietly(wait);
            }
            lastCallAtMs = System.currentTimeMillis();
        }
    }

    static long parseRetryDelayMs(String errorBody, long defaultMs) {
        if (errorBody == null || errorBody.isBlank()) {
            return defaultMs;
        }
        Matcher matcher = RETRY_DELAY_SECONDS.matcher(errorBody);
        if (matcher.find()) {
            try {
                return Long.parseLong(matcher.group(1)) * 1000L;
            } catch (NumberFormatException ignored) {
                // fall through
            }
        }
        return defaultMs;
    }

    static void sleepQuietly(long ms) {
        if (ms <= 0) {
            return;
        }
        try {
            Thread.sleep(ms);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new MonitorJobCancelledException();
        }
        MonitorJobCancellation.check();
    }

    private MonitorApiThrottle() {
        throw new UnsupportedOperationException();
    }
}
