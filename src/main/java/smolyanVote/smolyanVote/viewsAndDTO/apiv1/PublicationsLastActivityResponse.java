package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

import java.time.Instant;

/** GET /api/v1/publications/sidebar/last-activity — all fields null when no publication exists yet. */
public record PublicationsLastActivityResponse(Instant lastPostTime, Long lastPostId, String lastPostTitle,
                                                 String lastPostAuthor, String lastPostAuthorImage,
                                                 long lastPostLikes, long lastPostComments) {

    public static PublicationsLastActivityResponse empty() {
        return new PublicationsLastActivityResponse(null, null, null, null, null, 0, 0);
    }
}
