package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.UserRole;
import smolyanVote.smolyanVote.models.enums.UserRoleDefaults;
import smolyanVote.smolyanVote.models.enums.UserStatusEnum;
import smolyanVote.smolyanVote.services.interfaces.UserBanService;

import java.time.Instant;

/** JSON отговор за {@code GET /api/v1/users/me}. */
public record CurrentUserResponse(
        Long id,
        String username,
        String email,
        String imageUrl,
        String bio,
        UserRole role,
        UserStatusEnum status,
        Instant banEndDate,
        String banReason,
        int moderationStrikeCount,
        boolean readOnly
) {

    public static CurrentUserResponse fromEntity(UserEntity user, UserBanService userBanService) {
        UserEntity resolved = userBanService.resolveBanState(user);
        boolean readOnly = userBanService.isReadOnlyBanned(resolved);
        return new CurrentUserResponse(
                resolved.getId(),
                resolved.getUsername(),
                resolved.getEmail(),
                resolved.getImageUrl(),
                resolved.getBio(),
                UserRoleDefaults.effective(resolved.getRole()),
                resolved.getStatus(),
                resolved.getBanEndDate(),
                resolved.getBanReason(),
                resolved.getModerationStrikeCount(),
                readOnly
        );
    }
}
