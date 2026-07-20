package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

import smolyanVote.smolyanVote.models.enums.EventType;
import smolyanVote.smolyanVote.models.enums.Locations;
import smolyanVote.smolyanVote.viewsAndDTO.ImageRefDTO;
import smolyanVote.smolyanVote.viewsAndDTO.MultiPollDetailViewDTO;

import java.time.Instant;
import java.util.List;

/** GET /api/v1/events/multipoll/{id} — lean mapping of {@code MultiPollDetailViewDTO}. */
public record MultiPollDetailResponse(
        Long id,
        EventType eventType,
        String title,
        String description,
        Instant createdAt,
        Locations location,
        EventCreatorResponse creator,
        List<String> imageUrls,
        List<ImageRefDTO> imageRefs,
        List<String> currentUserVotes,
        List<String> optionsText,
        List<Integer> votesForOptions,
        List<Integer> votePercentages,
        int totalVotes,
        int totalUsersVotes,
        Integer currentUserVote,
        int viewCounter
) {

    public static MultiPollDetailResponse from(MultiPollDetailViewDTO dto) {
        return new MultiPollDetailResponse(
                dto.getId(),
                dto.getEventType(),
                dto.getTitle(),
                dto.getDescription(),
                dto.getCreatedAt(),
                dto.getLocation(),
                EventCreatorResponse.from(dto.getCreator()),
                dto.getImageUrls(),
                dto.getImageRefs(),
                dto.getCurrentUserVotes(),
                dto.getOptionsText(),
                dto.getVotesForOptions(),
                dto.getVotePercentages(),
                dto.getTotalVotes(),
                dto.getTotalUsersVotes(),
                dto.getCurrentUserVote(),
                dto.getViewCounter()
        );
    }
}
