package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

import java.util.List;

/** Offset-paginated wrapper for `GET /api/v1/users/{username}/followers|following` — mirrors legacy `page/size/hasNext` shape. */
public record FollowListResponse(List<FollowUserSummaryDTO> items, int page, int size, boolean hasNext) {

    public static FollowListResponse of(List<FollowUserSummaryDTO> items, int page, int size) {
        return new FollowListResponse(items, page, size, items.size() == size);
    }
}
