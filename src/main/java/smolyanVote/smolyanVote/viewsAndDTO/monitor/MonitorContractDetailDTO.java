package smolyanVote.smolyanVote.viewsAndDTO.monitor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * Public contract detail — all fields we import from SIGMA/EOP, shown in-app without
 * linking out to sigma.midt.bg.
 */
public record MonitorContractDetailDTO(
        Long id,
        String sigmaId,
        String unp,
        String subject,
        String shortSummary,
        String authorityName,
        String authorityEik,
        String contractorName,
        String contractorEik,
        String contractorKind,
        boolean hasSubcontractors,
        String subcontractorName,
        String subcontractorEik,
        BigDecimal subcontractingPercent,
        BigDecimal subcontractingAmountEur,
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
        String aiCategory,
        Integer impactScore,
        String regionScope,
        String dataSource,
        Instant fetchedAt,
        int relatedSignalsCount,
        List<MonitorRelatedSignalDTO> relatedSignals,
        List<MonitorAmendmentDTO> amendments,
        String insightHeadline,
        String whyItMatters,
        String concernType,
        String aiAnalysis,
        String sigmaUrl,
        Instant sigmaRefreshedAt
) {
}
