package smolyanVote.smolyanVote.viewsAndDTO.monitor;

public record MonitorSchedulerSettingsDTO(
        boolean schedulerEnabled,
        boolean sigmaEnabled,
        boolean eopEnabled,
        boolean scrapeEnabled,
        boolean aiBatchEnabled,
        int eopDays,
        int eopMaxDays,
        int aiBatchLimit
) {
}
