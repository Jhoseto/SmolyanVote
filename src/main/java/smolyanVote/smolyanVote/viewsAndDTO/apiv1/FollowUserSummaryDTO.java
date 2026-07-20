package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

import java.time.Instant;

/**
 * One row of `GET /api/v1/users/{username}/followers|following` — typed
 * replacement for the raw {@code Object[]} rows `UserFollowRepository`'s
 * native queries return (columns: id, username, image_url, role,
 * online_status, created, followed_at, followers_count).
 */
public record FollowUserSummaryDTO(
        Long id, String username, String imageUrl, String role, boolean online,
        Instant joined, Instant followedAt, long followersCount, boolean isFollowing) {

    public static FollowUserSummaryDTO fromRow(Object[] row, boolean isFollowing) {
        return new FollowUserSummaryDTO(
                (Long) row[0],
                (String) row[1],
                (String) row[2],
                (String) row[3],
                row[4] != null && ((Number) row[4]).intValue() != 0,
                toInstant(row[5]),
                toInstant(row[6]),
                row[7] != null ? ((Number) row[7]).longValue() : 0,
                isFollowing);
    }

    private static Instant toInstant(Object value) {
        if (value == null) return null;
        if (value instanceof Instant instant) return instant;
        if (value instanceof java.sql.Timestamp timestamp) return timestamp.toInstant();
        throw new IllegalStateException("Unexpected timestamp type: " + value.getClass());
    }
}
