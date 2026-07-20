package smolyanVote.smolyanVote.viewsAndDTO.apiv1;

import smolyanVote.smolyanVote.models.enums.EventType;
import smolyanVote.smolyanVote.models.enums.Locations;
import smolyanVote.smolyanVote.viewsAndDTO.ImageRefDTO;
import smolyanVote.smolyanVote.viewsAndDTO.SimpleEventDetailViewDTO;

import java.time.Instant;
import java.util.List;

/** GET /api/v1/events/simple/{id} — lean mapping of {@code SimpleEventDetailViewDTO}. */
public record SimpleEventDetailResponse(
        Long id,
        EventType eventType,
        String title,
        String description,
        Locations location,
        int viewCounter,
        Instant createdAt,
        EventCreatorResponse creator,
        List<String> images,
        List<ImageRefDTO> imageRefs,
        String currentUserVote,
        int yesVotes,
        int noVotes,
        int neutralVotes,
        int totalVotes,
        String positiveLabel,
        String negativeLabel,
        String neutralLabel,
        int yesPercent,
        int noPercent,
        int neutralPercent
) {

    public static SimpleEventDetailResponse from(SimpleEventDetailViewDTO dto) {
        return new SimpleEventDetailResponse(
                dto.getId(),
                dto.getEventType(),
                dto.getTitle(),
                dto.getDescription(),
                dto.getLocation(),
                dto.getViewCounter(),
                dto.getCreatedAt(),
                EventCreatorResponse.from(dto.getCreator()),
                dto.getImages(),
                dto.getImageRefs(),
                dto.getCurrentUserVote(),
                dto.getYesVotes(),
                dto.getNoVotes(),
                dto.getNeutralVotes(),
                dto.getTotalVotes(),
                dto.getPositiveLabel(),
                dto.getNegativeLabel(),
                dto.getNeutralLabel(),
                dto.getYesPercent(),
                dto.getNoPercent(),
                dto.getNeutralPercent()
        );
    }
}
