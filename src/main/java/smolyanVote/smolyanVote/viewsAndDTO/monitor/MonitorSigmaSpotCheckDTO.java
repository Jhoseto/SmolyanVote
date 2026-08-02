package smolyanVote.smolyanVote.viewsAndDTO.monitor;

import java.math.BigDecimal;
import java.util.List;

public record MonitorSigmaSpotCheckDTO(
        int sampled,
        int matched,
        int mismatched,
        int notInSigma,
        int sigmaFetchErrors,
        String message,
        List<SpotCheckRow> rows) {

    public record SpotCheckRow(
            String sigmaId,
            String unp,
            String authorityEik,
            BigDecimal localAmountEur,
            BigDecimal sigmaAmountEur,
            boolean match,
            String note) {
    }
}
