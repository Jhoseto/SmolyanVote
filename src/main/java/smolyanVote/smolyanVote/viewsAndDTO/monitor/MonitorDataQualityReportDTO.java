package smolyanVote.smolyanVote.viewsAndDTO.monitor;

import java.math.BigDecimal;
import java.util.List;

public record MonitorDataQualityReportDTO(
        long contractsTotal,
        long sigmaContracts,
        long eopContracts,
        long missingSignedAt,
        long missingOriginalCurrency,
        long currencyWarnings,
        long documentsWithAmountMissingCurrency,
        List<String> alerts) {
}
