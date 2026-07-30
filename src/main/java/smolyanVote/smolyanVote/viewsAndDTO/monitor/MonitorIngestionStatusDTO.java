package smolyanVote.smolyanVote.viewsAndDTO.monitor;

import java.time.Instant;

public record MonitorIngestionStatusDTO(
        String sigmaStatus,
        Instant sigmaLastRun,
        Integer sigmaRecordsProcessed,
        String sigmaMessage,
        String eopStatus,
        Instant eopLastRun,
        Integer eopRecordsProcessed,
        String eopMessage,
        String scrapeStatus,
        Instant scrapeLastRun,
        long contractCount,
        long documentCount
) {
}
