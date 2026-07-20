package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

import smolyanVote.smolyanVote.models.UserEntity;

/**
 * Lean creator projection for event detail responses — {@code UserEntity}
 * itself is never serialized directly (it carries ban/role/status fields
 * that have no business being in a public JSON payload).
 */
public record EventCreatorResponse(Long id, String username, String imageUrl) {

    public static EventCreatorResponse from(UserEntity user) {
        if (user == null) {
            return null;
        }
        return new EventCreatorResponse(user.getId(), user.getUsername(), user.getImageUrl());
    }
}
