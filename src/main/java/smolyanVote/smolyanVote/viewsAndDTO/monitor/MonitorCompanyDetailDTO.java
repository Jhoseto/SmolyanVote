package smolyanVote.smolyanVote.viewsAndDTO.monitor;

import java.math.BigDecimal;
import java.util.List;

public record MonitorCompanyDetailDTO(
        String eik,
        String name,
        BigDecimal totalWonEur,
        int contractCount,
        Integer compositeRiskScore,
        List<MonitorFeedItemDTO> recentContracts,
        String legalForm,
        String registeredAddress,
        String managersSummary,
        String registryStatus,
        java.time.Instant registryFetchedAt
) {
}
