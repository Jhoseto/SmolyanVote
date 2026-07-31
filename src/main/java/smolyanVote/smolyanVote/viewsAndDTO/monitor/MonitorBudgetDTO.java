package smolyanVote.smolyanVote.viewsAndDTO.monitor;

import java.math.BigDecimal;
import java.util.List;

public record MonitorBudgetDTO(
        int year,
        String municipality,
        BigDecimal totalPlannedEur,
        BigDecimal totalExecutedEur,
        List<BudgetRowDTO> rows,
        String sourceUrl,
        /** Planned figures are maintained for Община Смолян only; elsewhere only spend is real. */
        boolean plannedAvailable,
        String note
) {
    public record BudgetRowDTO(
            String id,
            String label,
            BigDecimal plannedEur,
            BigDecimal executedEur,
            double executionPercent
    ) {
    }
}
