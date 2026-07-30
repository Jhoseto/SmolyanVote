package smolyanVote.smolyanVote.viewsAndDTO.monitor;

import java.math.BigDecimal;
import java.util.List;

/** Simplified network graph — authorities ↔ top contractors. */
public record MonitorConnectionsDTO(
        List<ConnectionNodeDTO> nodes,
        List<ConnectionLinkDTO> links
) {
    public record ConnectionNodeDTO(
            String id,
            String label,
            String type,
            BigDecimal totalEur,
            int linkCount
    ) {
    }

    public record ConnectionLinkDTO(
            String source,
            String target,
            BigDecimal valueEur,
            long contractCount
    ) {
    }
}
