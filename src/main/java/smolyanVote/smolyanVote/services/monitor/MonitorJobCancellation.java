package smolyanVote.smolyanVote.services.monitor;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/** Cooperative cancellation for long-running monitor ingestion jobs. */
final class MonitorJobCancellation {

    private static final ThreadLocal<String> activeKey = new ThreadLocal<>();
    private static final Set<String> cancelledKeys = ConcurrentHashMap.newKeySet();

    private MonitorJobCancellation() {
        throw new UnsupportedOperationException();
    }

    static void begin(String key) {
        activeKey.set(key);
    }

    static void end() {
        activeKey.remove();
    }

    static void request(String key) {
        if (key != null && !key.isBlank()) {
            cancelledKeys.add(key);
        }
    }

    static void clear(String key) {
        if (key != null) {
            cancelledKeys.remove(key);
        }
    }

    static boolean isRequested(String key) {
        return key != null && cancelledKeys.contains(key);
    }

    static void check() {
        String key = activeKey.get();
        if (key != null && cancelledKeys.contains(key)) {
            throw new MonitorJobCancelledException();
        }
        if (Thread.currentThread().isInterrupted()) {
            throw new MonitorJobCancelledException();
        }
    }
}
