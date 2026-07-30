package smolyanVote.smolyanVote.viewsAndDTO.monitor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record MonitorOverviewDTO(
        BigDecimal spentYtdEur,
        long contractCount,
        long flaggedCount,
        long documentCount,
        long newDocumentsThisWeek,
        Instant dataFreshness
) {
}
