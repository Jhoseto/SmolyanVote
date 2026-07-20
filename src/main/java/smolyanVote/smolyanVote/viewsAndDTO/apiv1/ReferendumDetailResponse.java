package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

import smolyanVote.smolyanVote.models.enums.EventType;
import smolyanVote.smolyanVote.models.enums.Locations;
import smolyanVote.smolyanVote.viewsAndDTO.ImageRefDTO;
import smolyanVote.smolyanVote.viewsAndDTO.ReferendumDetailViewDTO;

import java.time.Instant;
import java.util.List;

/**
 * GET /api/v1/events/referendum/{id} — lean mapping of
 * {@code ReferendumDetailViewDTO}. Comments are intentionally omitted here
 * (raw {@code CommentsEntity} list) — the frontend fetches them separately
 * via the generic {@code GET /api/comments/REFERENDUM/{id}} endpoint.
 */
public record ReferendumDetailResponse(
        Long id,
        EventType eventType,
        String title,
        String description,
        Locations location,
        int viewCounter,
        Instant createdAt,
        EventCreatorResponse creator,
        List<String> imageUrls,
        List<ImageRefDTO> imageRefs,
        List<String> options,
        List<Integer> votes,
        List<Integer> votePercentages,
        int totalVotes,
        Integer currentUserVote
) {

    public static ReferendumDetailResponse from(ReferendumDetailViewDTO dto) {
        return new ReferendumDetailResponse(
                dto.getId(),
                dto.getEventType(),
                dto.getTitle(),
                dto.getDescription(),
                dto.getLocation(),
                dto.getViewCounter(),
                dto.getCreatedAt(),
                EventCreatorResponse.from(dto.getCreator()),
                dto.getImageUrls(),
                dto.getImageRefs(),
                dto.getOptions(),
                dto.getVotes(),
                dto.getVotePercentages(),
                dto.getTotalVotes(),
                dto.getCurrentUserVote()
        );
    }
}
