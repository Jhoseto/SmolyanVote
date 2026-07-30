package smolyanVote.smolyanVote.models.enums;

public enum MonitorIngestionStatus {
    RUNNING,
    SUCCESS,
    /** Some sources imported, others failed — details are in the run message. */
    PARTIAL,
    FAILED
}
