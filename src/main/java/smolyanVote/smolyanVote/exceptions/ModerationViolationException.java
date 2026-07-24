package smolyanVote.smolyanVote.exceptions;

import java.time.Instant;

/** Thrown when user content fails automated moderation (profanity, image, spam). */
public class ModerationViolationException extends RuntimeException {

    public enum ViolationType {
        PROFANITY, IMAGE, SPAM
    }

    private final ViolationType violationType;
    private final int strikeCount;
    private final int strikesUntilBan;
    private final boolean autoBanned;
    private final Instant banEndDate;

    public ModerationViolationException(
            String message,
            ViolationType violationType,
            int strikeCount,
            int strikesUntilBan,
            boolean autoBanned,
            Instant banEndDate) {
        super(message);
        this.violationType = violationType;
        this.strikeCount = strikeCount;
        this.strikesUntilBan = strikesUntilBan;
        this.autoBanned = autoBanned;
        this.banEndDate = banEndDate;
    }

    public ViolationType getViolationType() {
        return violationType;
    }

    public int getStrikeCount() {
        return strikeCount;
    }

    public int getStrikesUntilBan() {
        return strikesUntilBan;
    }

    public boolean isAutoBanned() {
        return autoBanned;
    }

    public Instant getBanEndDate() {
        return banEndDate;
    }
}
