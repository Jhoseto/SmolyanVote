package smolyanVote.smolyanVote.viewsAndDTO.monitor;

import java.math.BigDecimal;

public record MonitorBudgetLineRequest(
        String categoryKey,
        String label,
        BigDecimal plannedEur,
        String cpvPrefix,
        Integer budgetYear,
        Integer sortOrder
) {
}
