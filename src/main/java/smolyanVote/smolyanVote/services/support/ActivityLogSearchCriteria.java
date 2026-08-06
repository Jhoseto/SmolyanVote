package smolyanVote.smolyanVote.services.support;

import java.time.LocalDateTime;

/**
 * Combined filters for admin activity feed (all optional).
 */
public record ActivityLogSearchCriteria(
        String query,
        String username,
        String action,
        String entityType,
        String typeCategory,
        LocalDateTime since,
        boolean ipOnly
) {
    public static ActivityLogSearchCriteria empty() {
        return new ActivityLogSearchCriteria(null, null, null, null, null, null, false);
    }
}
