package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

import java.util.List;

/** GET /api/v1/publications/sidebar/top-authors */
public record TopAuthorsResponse(List<TopAuthorResponse> authors) {
}
