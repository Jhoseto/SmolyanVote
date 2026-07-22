package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

import smolyanVote.smolyanVote.models.SignalsEntity;
import smolyanVote.smolyanVote.models.UserEntity;

import java.time.Instant;

/**
 * {@code GET/POST/PUT /api/v1/signals} — typed response for the Next.js signals map.
 */
public record SignalResponseDTO(Long id, String title, String description, String category, String categoryLabel,
                                  Integer expirationDays, Instant activeUntil, boolean isActive,
                                  double latitude, double longitude, String imageUrl,
                                  Long authorId, String authorUsername, String authorImageUrl,
                                  Instant createdAt, Instant modifiedAt,
                                  int priorityBoostCount, int viewsCount, int commentsCount,
                                  boolean hasBoosted, boolean isOwner,
                                  boolean isResolved, String resolvedByUsername,
                                  String adminNotes,
                                  boolean isSubscribed, boolean hasReportedResolved, int resolvedReportCount) {

    public static SignalResponseDTO from(SignalsEntity signal, boolean hasBoosted, Long currentUserId) {
        return from(signal, new SignalEnrichment(hasBoosted, false, false, 0, currentUserId, false));
    }

    public static SignalResponseDTO from(SignalsEntity signal, boolean hasBoosted, Long currentUserId,
                                         boolean includeAdminNotes) {
        return from(signal, new SignalEnrichment(hasBoosted, false, false, 0, currentUserId, includeAdminNotes));
    }

    public static SignalResponseDTO from(SignalsEntity signal, SignalEnrichment enrichment) {
        UserEntity author = signal.getAuthor();
        Long userId = enrichment.currentUserId();
        boolean isOwner = userId != null && author != null && userId.equals(author.getId());
        UserEntity resolvedBy = signal.getResolvedBy();
        boolean isResolved = resolvedBy != null;

        return new SignalResponseDTO(
                signal.getId(), signal.getTitle(), signal.getDescription(),
                signal.getCategory().name(), signal.getCategory().getDisplayName(),
                signal.getExpirationDays(), signal.getActiveUntil(), signal.isActive(),
                signal.getLatitude() != null ? signal.getLatitude().doubleValue() : 0,
                signal.getLongitude() != null ? signal.getLongitude().doubleValue() : 0,
                signal.getImageUrl(),
                author != null ? author.getId() : null,
                author != null ? author.getUsername() : null,
                author != null ? author.getImageUrl() : null,
                signal.getCreated(), signal.getModified(),
                signal.getLikesCount() != null ? signal.getLikesCount() : 0,
                signal.getViewsCount() != null ? signal.getViewsCount() : 0,
                signal.getCommentsCount() != null ? signal.getCommentsCount() : 0,
                enrichment.hasBoosted(), isOwner,
                isResolved,
                resolvedBy != null ? resolvedBy.getUsername() : null,
                enrichment.includeAdminNotes() ? signal.getAdminNotes() : null,
                enrichment.isSubscribed(),
                enrichment.hasReportedResolved(),
                enrichment.resolvedReportCount());
    }
}
