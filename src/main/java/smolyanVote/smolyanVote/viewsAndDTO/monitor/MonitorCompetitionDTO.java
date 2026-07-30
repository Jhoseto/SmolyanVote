package smolyanVote.smolyanVote.viewsAndDTO.monitor;

import java.util.List;

public record MonitorCompetitionDTO(
        double singleBidderSharePercent,
        double hhiIndex,
        String competitionLabel,
        List<SectorCompetitionDTO> bySector
) {
    public record SectorCompetitionDTO(
            String sectorCode,
            double hhiIndex,
            long contractCount,
            String topContractorName
    ) {
    }
}
