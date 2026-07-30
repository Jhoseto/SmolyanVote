package smolyanVote.smolyanVote.viewsAndDTO.monitor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record MonitorFeedItemDTO(
        String id,
        String itemType,
        String title,
        String shortSummary,
        String category,
        Integer riskScore,
        List<RiskBadgeDTO> riskFlags,
        BigDecimal amountEur,
        LocalDate date,
        String sourceUrl,
        Instant publishedAt
) {
}
