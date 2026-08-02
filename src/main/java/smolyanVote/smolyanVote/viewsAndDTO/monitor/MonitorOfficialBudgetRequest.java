package smolyanVote.smolyanVote.viewsAndDTO.monitor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record MonitorOfficialBudgetRequest(
        Integer budgetYear,
        BigDecimal adoptedTotalBgn,
        BigDecimal executedTotalBgn,
        String sourceUrl,
        String sourceTitle,
        LocalDate executionAsOf,
        String notes,
        List<OfficialBudgetLineRequest> lines
) {
    public record OfficialBudgetLineRequest(
            String categoryKey,
            String label,
            BigDecimal adoptedBgn,
            BigDecimal executedBgn,
            Integer sortOrder
    ) {
    }
}
