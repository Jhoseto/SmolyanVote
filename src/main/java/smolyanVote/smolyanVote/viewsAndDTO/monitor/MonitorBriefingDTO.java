package smolyanVote.smolyanVote.viewsAndDTO.monitor;

import java.math.BigDecimal;
import java.util.List;

/** Regional accountability snapshot for the monitor home page. */
public record MonitorBriefingDTO(
        String headline,
        String narrative,
        long flaggedCount,
        BigDecimal flaggedAmountEur,
        BigDecimal spentYtdEur,
        List<MonitorBriefingThemeDTO> themes,
        List<MonitorFeedItemDTO> topConcerns,
        MonitorAiReportDTO aiReport,
        List<MonitorBriefingChartPointDTO> riskChart,
        List<MonitorBriefingChartPointDTO> councilChart,
        List<MonitorFeedItemDTO> recentDocuments) {
}
