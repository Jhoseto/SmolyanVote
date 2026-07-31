package smolyanVote.smolyanVote.viewsAndDTO.monitor;

import java.math.BigDecimal;
import java.util.List;

public record MonitorFlowsDTO(
        List<FlowNodeDTO> nodes,
        List<FlowLinkDTO> links
) {
    public record FlowNodeDTO(String id, String label, String type) {
    }

    public record FlowLinkDTO(
            String source,
            String target,
            BigDecimal valueEur,
            long count,
            int flaggedCount,
            String concernLabel,
            String citizenHint,
            int contractsWithSubcontractor,
            String subcontractorName,
            String subcontractorEik,
            BigDecimal subcontractingTotalEur) {
    }
}
