package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.UserRole;

/** JSON отговор за {@code GET /api/v1/users/me}. */
public record CurrentUserResponse(
        Long id,
        String username,
        String email,
        String imageUrl,
        String bio,
        UserRole role
) {

    public static CurrentUserResponse fromEntity(UserEntity user) {
        return new CurrentUserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getImageUrl(),
                user.getBio(),
                user.getRole()
        );
    }
}
