package smolyanVote.smolyanVote.viewsAndDTO.monitor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Adopted municipal budget (ObS decision) with optional reported absorption. */
public record MonitorOfficialBudgetDTO(
        int year,
        String municipality,
        BigDecimal adoptedTotalBgn,
        BigDecimal adoptedTotalEur,
        BigDecimal executedTotalBgn,
        BigDecimal executedTotalEur,
        Double executionPercent,
        LocalDate executionAsOf,
        List<OfficialBudgetRowDTO> rows,
        String sourceUrl,
        String sourceTitle,
        String note,
        MonitorCitizenAssessmentDTO citizenAssessment
) {
    public record OfficialBudgetRowDTO(
            String id,
            String label,
            BigDecimal adoptedBgn,
            BigDecimal adoptedEur,
            BigDecimal executedBgn,
            BigDecimal executedEur,
            Double executionPercent
    ) {
    }
}
