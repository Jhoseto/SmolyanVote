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

    public enum JobStatus {
        /** Waiting for another job to finish. */
        QUEUED,
        RUNNING,
        SUCCESS,
        FAILED,
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

    private final ExecutorService executor = Executors.newSingleThreadExecutor(runnable -> {
        Thread thread = new Thread(runnable, "monitor-ingestion");
        thread.setDaemon(true);
        return thread;
    });

    /** Last known state per job key — running jobs and the outcome of finished ones. */
    private final Map<String, JobState> states = new ConcurrentHashMap<>();

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

        boolean waiting = pending.incrementAndGet() > 1;
        JobState accepted = new JobState(key, label,
                waiting ? JobStatus.QUEUED : JobStatus.RUNNING,
                waiting ? label + " е на изчакване след текущата задача…" : label + " стартира…",
                Instant.now(), null);
        states.put(key, accepted);

        try {
            executor.submit(() -> runJob(key, label, job));
        } catch (RuntimeException ex) {
            pending.decrementAndGet();
            states.put(key, new JobState(key, label, JobStatus.FAILED,
                    "Задачата не беше приета: " + MonitorIngestionRunService.describe(ex),
                    accepted.startedAt(), Instant.now()));
            throw ex;
        }

        return accepted;
    }

    private void runJob(String key, String label, Callable<JobResult> job) {
        Instant startedAt = Instant.now();
        states.put(key, new JobState(key, label, JobStatus.RUNNING, label + " се изпълнява…", startedAt, null));
        try {
            JobResult result = job.call();
            String message = result == null || result.message() == null || result.message().isBlank()
                    ? label + " завърши."
                    : result.message();
            JobStatus status = result != null && !result.ok() ? JobStatus.FAILED : JobStatus.SUCCESS;
            states.put(key, new JobState(key, label, status, message, startedAt, Instant.now()));
        } catch (Exception ex) {
            log.error("Monitor job {} failed", key, ex);
            states.put(key, new JobState(key, label, JobStatus.FAILED,
                    MonitorIngestionRunService.describe(ex), startedAt, Instant.now()));
        } finally {
            pending.decrementAndGet();
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
