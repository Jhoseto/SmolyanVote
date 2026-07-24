package smolyanVote.smolyanVote.exceptions;

import java.time.Instant;

/** Thrown when a banned user attempts a write operation. */
public class UserBannedException extends RuntimeException {

    private final Instant banEndDate;
    private final String banReason;
    private final boolean permanent;

    public UserBannedException(String message, Instant banEndDate, String banReason, boolean permanent) {
        super(message);
        this.banEndDate = banEndDate;
        this.banReason = banReason;
        this.permanent = permanent;
    }

    public Instant getBanEndDate() {
        return banEndDate;
    }

    public String getBanReason() {
        return banReason;
    }

    public boolean isPermanent() {
        return permanent;
    }
}
