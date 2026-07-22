package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

/** One row of GET /api/v1/publications/sidebar/online-users */
public record OnlineUserResponse(
        Long id, String username, String imageUrl, boolean isFollowing, boolean isSelf) {}
