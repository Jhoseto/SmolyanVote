package smolyanVote.smolyanVote.viewsAndDTO.monitor;

import java.util.List;

/** Plain-language citizen view of municipal budget performance for a year. */
public record MonitorCitizenAssessmentDTO(
        String headline,
        String verdict,
        List<String> successes,
        List<String> concerns,
        String citizenImpact
) {
}
