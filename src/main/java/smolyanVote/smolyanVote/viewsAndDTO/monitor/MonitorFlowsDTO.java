package smolyanVote.smolyanVote.viewsAndDTO.monitor;

import java.math.BigDecimal;
import java.util.List;

public record MonitorFlowsDTO(
        List<FlowNodeDTO> nodes,
        List<FlowLinkDTO> links,
        List<FlowSubLinkDTO> subLinks,
        SubcontractorCoverageDTO subcontractorCoverage) {

    public record SubcontractorCoverageDTO(int declaredContracts, int withAmountEur) {
    }

    public record FlowNodeDTO(String id, String label, String type, BigDecimal totalEur) {
    }

    public record FlowSubPreviewDTO(String eik, String name, BigDecimal valueEur, int count) {
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
            BigDecimal subcontractingTotalEur,
            List<FlowSubPreviewDTO> topSubcontractors) {
    }

    public record FlowSubLinkDTO(
            String source,
            String target,
            BigDecimal valueEur,
            long count,
            String subcontractorName,
            String subcontractorEik) {
    }
}
