package smolyanVote.smolyanVote.viewsAndDTO.monitor;

import java.math.BigDecimal;

public record MonitorBriefingThemeDTO(
        String code,
        String label,
        long count,
        BigDecimal amountEur,
        String explanation) {
}
