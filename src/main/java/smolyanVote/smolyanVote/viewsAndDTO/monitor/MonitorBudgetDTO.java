package smolyanVote.smolyanVote.viewsAndDTO.monitor;

import java.math.BigDecimal;
import java.util.List;

public record MonitorBudgetDTO(
        int year,
        int yearTo,
        List<Integer> availableYears,
        String municipality,
        BigDecimal totalPlannedEur,
        BigDecimal totalExecutedEur,
        List<BudgetRowDTO> rows,
        String sourceUrl,
        /** Planned figures are maintained for Община Смолян only; elsewhere only spend is real. */
        boolean plannedAvailable,
        int contractCount,
        String dataBasis,
        String note,
        /** Adopted ObS budget for Община Смолян when available for the selected year. */
        MonitorOfficialBudgetDTO officialBudget
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
