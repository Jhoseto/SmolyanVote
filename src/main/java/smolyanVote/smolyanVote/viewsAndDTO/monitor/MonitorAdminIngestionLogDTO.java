package smolyanVote.smolyanVote.viewsAndDTO.monitor;

import java.time.Instant;

public record MonitorAdminIngestionLogDTO(
        Long id,
        String ingestionType,
        String status,
        Instant startedAt,
        Instant finishedAt,
        Integer recordsProcessed,
        String message
) {
}
