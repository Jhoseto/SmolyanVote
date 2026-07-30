package smolyanVote.smolyanVote.viewsAndDTO.monitor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record MonitorContractDetailDTO(
        Long id,
        String sigmaId,
        String subject,
        String shortSummary,
        String authorityName,
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
        List<RiskBadgeDTO> riskFlags,
        String sourceUrl,
        String regionScope,
        int relatedSignalsCount,
        List<MonitorRelatedSignalDTO> relatedSignals,
        List<MonitorAmendmentDTO> amendments
) {
}
