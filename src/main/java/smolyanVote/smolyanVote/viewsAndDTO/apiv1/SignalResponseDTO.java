package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

import smolyanVote.smolyanVote.models.SignalsEntity;
import smolyanVote.smolyanVote.models.UserEntity;

import java.time.Instant;

/**
 * `GET/POST/PUT /api/v1/signals` — порт на legacy `SignalsController#convertSignalToJson`
 * (MODERN_FRONTEND_PLAN.md Фаза 5), с типизирани полета вместо `Map&lt;String,Object&gt;`
 * и добавени `isLiked`/`isOwner` (както при publications detail).
 */
public record SignalResponseDTO(Long id, String title, String description, String category, String categoryLabel,
                                  Integer expirationDays, Instant activeUntil, boolean isActive,
                                  double latitude, double longitude, String imageUrl,
                                  Long authorId, String authorUsername, String authorImageUrl,
                                  Instant createdAt, Instant modifiedAt,
                                  int likesCount, int viewsCount, int commentsCount,
                                  boolean isLiked, boolean isOwner) {

    public static SignalResponseDTO from(SignalsEntity signal, boolean isLiked, Long currentUserId) {
        UserEntity author = signal.getAuthor();
        boolean isOwner = currentUserId != null && author != null && currentUserId.equals(author.getId());

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
                isLiked, isOwner);
    }
}
