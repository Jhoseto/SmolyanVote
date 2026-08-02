package smolyanVote.smolyanVote.viewsAndDTO.monitor;

import java.math.BigDecimal;
import java.time.LocalDate;

/** One year in the official budget multi-year trend (plan vs execution). */
public record MonitorOfficialBudgetTrendPointDTO(
        int year,
        BigDecimal adoptedTotalBgn,
        BigDecimal executedTotalBgn,
        Double executionPercent,
        Double yoyAdoptedPercent
) {
}
