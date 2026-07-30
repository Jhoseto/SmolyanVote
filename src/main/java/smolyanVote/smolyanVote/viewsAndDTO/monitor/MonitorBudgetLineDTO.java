package smolyanVote.smolyanVote.viewsAndDTO.monitor;

import java.math.BigDecimal;

public record MonitorBudgetLineDTO(
        Long id,
        String categoryKey,
        String label,
        BigDecimal plannedEur,
        BigDecimal executedEur,
        String cpvPrefix,
        int budgetYear,
        int sortOrder
) {
}
