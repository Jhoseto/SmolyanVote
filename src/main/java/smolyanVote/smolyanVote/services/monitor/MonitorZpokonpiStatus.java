package smolyanVote.smolyanVote.services.monitor;

/**
 * Outcome of automated cross-check against municipal ZPKONPI registers and official rosters.
 */
public enum MonitorZpokonpiStatus {
    /** Declaration found in a public ZPKONPI register page. */
    OK,
    /** Confirmed on official roster; register missing or person not listed there yet. */
    ROSTER_ONLY,
    /** Discrepancy — missing from roster, late submission list, etc. */
    WARNING,
    /** Register fetched but person not listed. */
    NOT_FOUND,
    /** Source pages could not be retrieved. */
    UNAVAILABLE,
    /** Automatic check not run yet. */
    PENDING
}
