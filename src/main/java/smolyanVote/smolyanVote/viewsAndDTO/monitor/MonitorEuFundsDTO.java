package smolyanVote.smolyanVote.viewsAndDTO.monitor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record MonitorEuFundsDTO(
        BigDecimal totalEur,
        int projectCount,
        List<EuProjectRowDTO> projects,
        String dataNote
) {
    public record EuProjectRowDTO(
            Long contractId,
            String title,
            String municipality,
            String contractorName,
            BigDecimal amountEur,
            LocalDate signedAt,
            String sourceUrl
    ) {
    }
}
