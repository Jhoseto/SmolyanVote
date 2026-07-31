package smolyanVote.smolyanVote.viewsAndDTO.monitor;

import java.time.Instant;
import java.util.List;

/** Full AI-generated accountability report — the core citizen-facing product. */
public record MonitorAiReportDTO(
        String executiveSummary,
        List<MonitorAiFindingDTO> moneyLeaks,
        List<MonitorAiFindingDTO> irregularities,
        List<String> conclusions,
        List<String> watchNext,
        Instant generatedAt,
        boolean aiGenerated) {

    public static MonitorAiReportDTO empty() {
        return new MonitorAiReportDTO(null, List.of(), List.of(), List.of(), List.of(), null, false);
    }
}
