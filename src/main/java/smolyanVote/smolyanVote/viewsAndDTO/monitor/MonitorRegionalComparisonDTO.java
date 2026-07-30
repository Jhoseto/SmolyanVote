package smolyanVote.smolyanVote.viewsAndDTO.monitor;

import java.math.BigDecimal;
import java.util.List;

public record MonitorRegionalComparisonDTO(
        List<MunicipalityRowDTO> municipalities
) {
    public record MunicipalityRowDTO(
            String eik,
            String name,
            BigDecimal totalSpentEur,
            long contractCount,
            Double avgBidsReceived,
            double singleBidderSharePercent
    ) {
    }
}
