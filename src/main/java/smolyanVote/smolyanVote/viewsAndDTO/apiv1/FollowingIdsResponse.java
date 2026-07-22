package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

import java.util.List;

/** GET /api/v1/users/me/following-ids */
public record FollowingIdsResponse(List<Long> ids) {}
