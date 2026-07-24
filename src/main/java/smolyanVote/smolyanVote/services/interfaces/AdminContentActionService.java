package smolyanVote.smolyanVote.services.interfaces;

import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.ReportableEntityType;

import java.util.Map;

public interface AdminContentActionService {

    /**
     * Deletes reported content, resolves related reports, optionally bans the author.
     */
    Map<String, Object> takeActionOnEntity(
            ReportableEntityType entityType,
            Long entityId,
            UserEntity admin,
            String action,
            String adminNotes,
            boolean banAuthor,
            String banReason);

    Long resolveAuthorId(ReportableEntityType entityType, Long entityId);
}
