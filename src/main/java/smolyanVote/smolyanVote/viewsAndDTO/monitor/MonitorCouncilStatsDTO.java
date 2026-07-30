package smolyanVote.smolyanVote.viewsAndDTO.monitor;

import java.time.Instant;
import java.util.List;

/** Council activity overview — document counts, not councilor dumps. */
public record MonitorCouncilStatsDTO(
        long totalDocuments,
        List<CouncilTypeCardDTO> byType
) {
    public record CouncilTypeCardDTO(
            String type,
            String label,
            long count,
            Instant latestDate,
            String latestTitle
    ) {
    }
}
