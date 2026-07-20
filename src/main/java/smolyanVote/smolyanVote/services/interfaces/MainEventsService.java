package smolyanVote.smolyanVote.services.interfaces;

import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.enums.EventType;
import smolyanVote.smolyanVote.viewsAndDTO.EventSimpleViewDTO;
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.EventsCatalogResponse;

import java.util.List;
import java.util.Map;

public interface MainEventsService {

    /**
     * Full catalog for the events hub. Optional {@code currentUserId} enriches
     * follow/vote meta used by client-side quick filters.
     */
    @Transactional(readOnly = true)
    EventsCatalogResponse getEventsCatalog(Long currentUserId);

    @Transactional(readOnly = true)
    List<EventSimpleViewDTO> getAllUserEvents(String username);

    @Transactional(readOnly = true)
    Map<String, Object> getEventsStatistics();

    @Transactional(readOnly = true)
    List<EventSimpleViewDTO> getRecommendedEvents(Long userId, int limit);

    @Transactional(readOnly = true)
    List<EventSimpleViewDTO> getSimilarEvents(Long eventId, EventType eventType, int limit);
}
