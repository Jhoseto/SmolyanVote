package smolyanVote.smolyanVote.viewsAndDTO.monitor;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MonitorAdminContractDTO(
        Long id,
        String sigmaId,
        String unp,
        String subject,
        String authorityName,
        String authorityEik,
        String contractorName,
        String contractorEik,
        String sectorCode,
        String procedureType,
        LocalDate signedAt,
        BigDecimal amountEur,
        BigDecimal originalAmountEur,
        BigDecimal estimatedValueEur,
        LocalDate publicationDate,
        boolean euFunded,
        Integer bidsReceived,
        Integer riskScore,
        String sourceUrl
) {
}
