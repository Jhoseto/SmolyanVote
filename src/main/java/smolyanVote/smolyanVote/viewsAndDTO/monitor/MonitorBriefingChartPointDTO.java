package smolyanVote.smolyanVote.viewsAndDTO.monitor;

import java.math.BigDecimal;

/** Single point for briefing charts (Recharts-ready). */
public record MonitorBriefingChartPointDTO(
        String label,
        long count,
        BigDecimal amountEur,
        String color) {
}
