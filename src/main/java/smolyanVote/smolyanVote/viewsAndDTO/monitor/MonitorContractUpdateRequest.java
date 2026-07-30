package smolyanVote.smolyanVote.viewsAndDTO.monitor;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MonitorContractUpdateRequest(
        String subject,
        String authorityName,
        String authorityEik,
        String contractorName,
        String contractorEik,
        String sectorCode,
        String procedureType,
        LocalDate signedAt,
        BigDecimal amountEur,
        boolean euFunded,
        Integer bidsReceived,
        String sourceUrl
) {
}
