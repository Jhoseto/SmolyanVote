package smolyanVote.smolyanVote.viewsAndDTO.monitor;

public record MonitorCouncilorCardDTO(
        Long id,
        String fullName,
        String roleLabel,
        String party,
        String mandatePeriod,
        boolean zpokonpiChecked,
        String zpokonpiNote,
        String sourceUrl,
        String zpokonpiPortalUrl
) {
}
