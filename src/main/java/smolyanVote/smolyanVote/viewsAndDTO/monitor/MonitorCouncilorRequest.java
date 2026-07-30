package smolyanVote.smolyanVote.viewsAndDTO.monitor;

public record MonitorCouncilorRequest(
        String fullName,
        String roleLabel,
        String party,
        String mandatePeriod,
        boolean zpokonpiChecked,
        String zpokonpiNote,
        String sourceUrl
) {
}
