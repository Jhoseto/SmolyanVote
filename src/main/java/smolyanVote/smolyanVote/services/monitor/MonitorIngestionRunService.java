package smolyanVote.smolyanVote.services.monitor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.enums.MonitorIngestionStatus;
import smolyanVote.smolyanVote.models.enums.MonitorIngestionType;
import smolyanVote.smolyanVote.models.monitor.MonitorIngestionRunEntity;
import smolyanVote.smolyanVote.repositories.monitor.MonitorIngestionRunRepository;

import java.time.Instant;

/**
 * Bookkeeping for ingestion runs.
 *
 * <p>Every method commits in its own transaction: an import that rolls back must not
 * erase the record of its own failure, otherwise the admin panel shows nothing and the
 * HTTP layer answers with a bare 409.
 */
@Service
public class MonitorIngestionRunService {

    private static final Logger log = LoggerFactory.getLogger(MonitorIngestionRunService.class);
    private static final int MESSAGE_LIMIT = 4000;

    private final MonitorIngestionRunRepository repository;

    public MonitorIngestionRunService(MonitorIngestionRunRepository repository) {
        this.repository = repository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public MonitorIngestionRunEntity start(MonitorIngestionType type) {
        MonitorIngestionRunEntity run = new MonitorIngestionRunEntity();
        run.setIngestionType(type);
        run.setStatus(MonitorIngestionStatus.RUNNING);
        run.setStartedAt(Instant.now());
        return repository.save(run);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public MonitorIngestionRunEntity succeed(Long runId, int recordsProcessed, String message) {
        return finish(runId, MonitorIngestionStatus.SUCCESS, recordsProcessed, message);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public MonitorIngestionRunEntity fail(Long runId, int recordsProcessed, String message) {
        return finish(runId, MonitorIngestionStatus.FAILED, recordsProcessed, message);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public MonitorIngestionRunEntity finish(Long runId,
                                            MonitorIngestionStatus status,
                                            int recordsProcessed,
                                            String message) {
        MonitorIngestionRunEntity run = repository.findById(runId).orElse(null);
        if (run == null) {
            log.warn("Ingestion run {} no longer exists; cannot record {}", runId, status);
            return null;
        }
        run.setStatus(status);
        run.setRecordsProcessed(recordsProcessed);
        run.setMessage(clamp(message));
        run.setFinishedAt(Instant.now());
        return repository.save(run);
    }

    /**
     * Human-readable cause of a failure. Nested exceptions usually carry the useful part
     * (HTTP status, SQL constraint) in the root, while the top-level message is a wrapper.
     */
    public static String describe(Throwable ex) {
        Throwable root = ex;
        while (root.getCause() != null && root.getCause() != root) {
            root = root.getCause();
        }
        String own = ex.getMessage();
        String rootMessage = root.getMessage();
        if (rootMessage == null || rootMessage.isBlank()) {
            rootMessage = root.getClass().getSimpleName();
        }
        if (own == null || own.isBlank() || own.equals(rootMessage)) {
            return rootMessage;
        }
        return own + " | " + rootMessage;
    }

    private static String clamp(String message) {
        if (message == null) {
            return null;
        }
        return message.length() <= MESSAGE_LIMIT ? message : message.substring(0, MESSAGE_LIMIT - 3) + "...";
    }
}
