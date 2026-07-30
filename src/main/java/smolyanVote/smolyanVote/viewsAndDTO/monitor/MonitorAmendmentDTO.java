package smolyanVote.smolyanVote.viewsAndDTO.monitor;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MonitorAmendmentDTO(
        Long id,
        LocalDate amendedAt,
        BigDecimal previousAmountEur,
        BigDecimal newAmountEur,
        BigDecimal deltaEur,
        String changeDescription,
        String changeReason,
        String sourceUrl
) {
}
