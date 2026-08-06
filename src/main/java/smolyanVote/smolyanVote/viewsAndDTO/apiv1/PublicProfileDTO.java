package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.services.support.ReputationCalculator;

import java.time.Instant;

/**
 * `GET /api/v1/users/{username}` — JWT-compatible port of legacy
 * `unified-profile`/`UserController#convertProfileViewModelToMap`
 * (MODERN_FRONTEND_PLAN.md Фаза 7), with typed fields instead of
 * {@code Map<String,Object>} and {@code bio}/{@code location} finally
 * included (legacy AJAX edit response silently omitted them).
 */
public record PublicProfileDTO(
        Long id, String username, String realName, String imageUrl, String bio,
        String location, String locationLabel, String role,
        Instant created, Instant lastOnline, boolean online,
        int eventsCount, int publicationsCount, int signalsCount, int votesCount, int commentsCount,
        long followersCount, long followingCount,
        boolean isFollowing, boolean isOwnProfile,
        int reputationScore, String reputationBadge) {

    public static PublicProfileDTO from(UserEntity user, long followersCount, long followingCount,
                                         boolean isFollowing, boolean isOwnProfile) {
        int reputationScore = ReputationCalculator.score(user);

        return new PublicProfileDTO(
                user.getId(), user.getUsername(), user.getRealName(), user.getImageUrl(), user.getBio(),
                user.getLocation() != null ? user.getLocation().name() : null,
                user.getLocation() != null ? user.getLocation().toBG() : null,
                user.getRole().name(),
                user.getCreated(), user.getLastOnline(), user.getOnlineStatus() != 0,
                user.getUserEventsCount(), user.getPublicationsCount(), user.getSignalsCount(), user.getTotalVotes(),
                user.getCommentsCount(),
                followersCount, followingCount,
                isFollowing, isOwnProfile,
                reputationScore, ReputationCalculator.badge(user));
    }
}
