package smolyanVote.smolyanVote.viewsAndDTO.monitor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record MonitorFlowPathDetailDTO(
        FlowPartyDTO authority,
        FlowPartyDTO contractor,
        FlowPathTotalsDTO totals,
        List<FlowContractSliceDTO> contracts) {

    public record FlowPartyDTO(String eik, String name, String nodeId) {
    }

    public record FlowPathTotalsDTO(
            BigDecimal totalEur,
            long contractCount,
            BigDecimal subcontractingTotalEur,
            int contractsWithSubcontractor) {
    }

    public record FlowContractSliceDTO(
            Long id,
            String subject,
            LocalDate signedAt,
            BigDecimal amountEur,
            String subcontractorName,
            String subcontractorEik,
            BigDecimal subcontractingAmountEur,
            BigDecimal subcontractingPercent,
            String concernLabel,
            String citizenHint) {
    }
}
