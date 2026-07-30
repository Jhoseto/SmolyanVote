package smolyanVote.smolyanVote.viewsAndDTO.monitor;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MonitorAdminCompanyDTO(
        Long id,
        String eik,
        String name,
        boolean consortium,
        BigDecimal totalWonEur,
        Integer contractCount,
        Integer compositeRiskScore,
        String legalForm,
        String registeredAddress,
        String managersSummary,
        String registryStatus,
        LocalDate foundedAt
) {
}
