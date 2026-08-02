package smolyanVote.smolyanVote.services.monitor;

/** Background ingestion job was stopped by an admin or thread interrupt. */
public class MonitorJobCancelledException extends RuntimeException {

    public MonitorJobCancelledException() {
        super("Спрян от администратор");
    }
}
