package smolyanVote.smolyanVote.services.interfaces;

import smolyanVote.smolyanVote.models.UserEntity;

import java.time.Instant;

public interface UserBanService {

    int MAX_STRIKES_BEFORE_AUTO_BAN = 3;
    int AUTO_BAN_HOURS = 1;

    /** Clears expired temporary bans and returns the up-to-date entity state. */
    UserEntity resolveBanState(UserEntity user);

    boolean isPermanentlyBanned(UserEntity user);

    boolean isTemporarilyBanned(UserEntity user);

    /** True when the user may browse but must not mutate anything. */
    boolean isReadOnlyBanned(UserEntity user);

    void ensureCanInteract(UserEntity user);

    record StrikeResult(int strikeCount, int strikesUntilBan, boolean autoBanned, Instant banEndDate) {}

    StrikeResult recordModerationStrike(UserEntity user, String reason);
}
