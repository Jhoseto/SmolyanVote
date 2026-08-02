package smolyanVote.smolyanVote.services.monitor;

import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Callable;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Runs ingestion jobs off the request thread.
 *
 * <p>A full SIGMA import takes minutes, which is far longer than the proxy and browser
 * are willing to wait — synchronous triggers died with a gateway error while the import
 * kept running invisibly. Triggers now return immediately and the admin panel follows
 * progress through {@link #snapshot()}.
 *
 * <p>Jobs run one at a time: they share the database and hit rate-limited public APIs,
 * so overlapping runs would only slow each other down.
 */
@Service
public class MonitorJobLauncher {

    private static final Logger log = LoggerFactory.getLogger(MonitorJobLauncher.class);
    private static final String CANCELLED_MESSAGE = "Спрян от администратор";

    public enum JobStatus {
        /** Waiting for another job to finish. */
        QUEUED,
        RUNNING,
        SUCCESS,
        FAILED,
        CANCELLED,
        /** Not accepted — the same job is already queued or running. */
        BUSY
    }

    public record JobState(String key,
                           String label,
                           JobStatus status,
                           String message,
                           Instant startedAt,
                           Instant finishedAt) {
    }

    /** What a job reports back: a source that answered with errors is not a success. */
    public record JobResult(boolean ok, String message) {

        public static JobResult ok(String message) {
            return new JobResult(true, message);
        }

        public static JobResult failed(String message) {
            return new JobResult(false, message);
        }
    }

    public record CancelResult(boolean accepted, String message) {
    }

    private final ExecutorService executor = Executors.newSingleThreadExecutor(runnable -> {
        Thread thread = new Thread(runnable, "monitor-ingestion");
        thread.setDaemon(true);
        return thread;
    });

    /** Last known state per job key — running jobs and the outcome of finished ones. */
    private final Map<String, JobState> states = new ConcurrentHashMap<>();

    /** In-flight executor tasks — used to interrupt a running job. */
    private final Map<String, Future<?>> futures = new ConcurrentHashMap<>();

    /** Accepted but not yet finished jobs; anything beyond the first has to wait its turn. */
    private final AtomicInteger pending = new AtomicInteger();

    /**
     * Queues {@code job}; its return value becomes the message shown in the panel.
     *
     * @return the accepted state, or a {@link JobStatus#BUSY} state if this job is already pending
     */
    public JobState launch(String key, String label, Callable<JobResult> job) {
        JobState current = states.get(key);
        if (current != null && isPending(current.status())) {
            return new JobState(key, label, JobStatus.BUSY,
                    label + " вече се изпълнява — изчакайте да завърши.",
                    current.startedAt(), null);
        }

        MonitorJobCancellation.clear(key);

        boolean waiting = pending.incrementAndGet() > 1;
        JobState accepted = new JobState(key, label,
                waiting ? JobStatus.QUEUED : JobStatus.RUNNING,
                waiting ? label + " е на изчакване след текущата задача…" : label + " стартира…",
                Instant.now(), null);
        states.put(key, accepted);

        try {
            Future<?> future = executor.submit(() -> runJob(key, label, job));
            futures.put(key, future);
        } catch (RuntimeException ex) {
            pending.decrementAndGet();
            futures.remove(key);
            states.put(key, new JobState(key, label, JobStatus.FAILED,
                    "Задачата не беше приета: " + MonitorIngestionRunService.describe(ex),
                    accepted.startedAt(), Instant.now()));
            throw ex;
        }

        return accepted;
    }

    /**
     * Stops a queued or running job. Running work is interrupted; DB ingestion logs
     * are closed separately by the controller.
     */
    public CancelResult cancel(String key) {
        JobState current = states.get(key);
        if (current == null || !isPending(current.status())) {
            return new CancelResult(false, "Няма активна задача „" + key + "“.");
        }

        MonitorJobCancellation.request(key);
        Future<?> future = futures.get(key);
        if (future != null) {
            future.cancel(true);
        }

        Instant now = Instant.now();
        states.put(key, new JobState(key, current.label(), JobStatus.CANCELLED,
                CANCELLED_MESSAGE, current.startedAt(), now));
        log.info("Monitor job {} cancel requested", key);
        return new CancelResult(true, current.label() + " — спиране…");
    }

    /** Cancels every queued or running job. */
    public int cancelAll() {
        List<String> keys = states.values().stream()
                .filter(state -> isPending(state.status()))
                .map(JobState::key)
                .distinct()
                .toList();
        int count = 0;
        for (String key : keys) {
            if (cancel(key).accepted()) {
                count++;
            }
        }
        return count;
    }

    public boolean hasPendingJobs() {
        return states.values().stream().anyMatch(state -> isPending(state.status()));
    }

    private void runJob(String key, String label, Callable<JobResult> job) {
        Instant startedAt = Instant.now();
        boolean cancelled = false;
        try {
            if (MonitorJobCancellation.isRequested(key)) {
                cancelled = true;
                return;
            }

            states.put(key, new JobState(key, label, JobStatus.RUNNING, label + " се изпълнява…", startedAt, null));
            MonitorJobCancellation.begin(key);
            JobResult result = job.call();

            if (MonitorJobCancellation.isRequested(key) || Thread.currentThread().isInterrupted()) {
                cancelled = true;
                return;
            }

            String message = result == null || result.message() == null || result.message().isBlank()
                    ? label + " завърши."
                    : result.message();
            JobStatus status = result != null && !result.ok() ? JobStatus.FAILED : JobStatus.SUCCESS;
            states.put(key, new JobState(key, label, status, message, startedAt, Instant.now()));
        } catch (MonitorJobCancelledException ex) {
            cancelled = true;
        } catch (Exception ex) {
            if (MonitorJobCancellation.isRequested(key) || Thread.currentThread().isInterrupted()) {
                cancelled = true;
            } else {
                log.error("Monitor job {} failed", key, ex);
                states.put(key, new JobState(key, label, JobStatus.FAILED,
                        MonitorIngestionRunService.describe(ex), startedAt, Instant.now()));
            }
        } finally {
            MonitorJobCancellation.end();
            MonitorJobCancellation.clear(key);
            futures.remove(key);
            pending.decrementAndGet();
            if (cancelled) {
                states.put(key, new JobState(key, label, JobStatus.CANCELLED,
                        CANCELLED_MESSAGE, startedAt, Instant.now()));
                Thread.interrupted();
                log.info("Monitor job {} cancelled", key);
            }
        }
    }

    public boolean isPending(String key) {
        JobState state = states.get(key);
        return state != null && isPending(state.status());
    }

    /** Running and recently finished jobs, newest first. */
    public List<JobState> snapshot() {
        return states.values().stream()
                .sorted(Comparator.comparing(JobState::startedAt).reversed())
                .toList();
    }

    private static boolean isPending(JobStatus status) {
        return status == JobStatus.QUEUED || status == JobStatus.RUNNING;
    }

    @PreDestroy
    void shutdown() {
        cancelAll();
        executor.shutdownNow();
        try {
            if (!executor.awaitTermination(5, TimeUnit.SECONDS)) {
                log.warn("Monitor ingestion executor did not stop within 5s");
            }
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
        }
    }
}
