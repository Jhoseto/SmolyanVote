package smolyanVote.smolyanVote.services.interfaces;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.enums.EventStatus;
import smolyanVote.smolyanVote.models.enums.EventType;
import smolyanVote.smolyanVote.viewsAndDTO.EventSimpleViewDTO;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public interface MainEventsService {


    @Transactional(readOnly = true)
    Page<EventSimpleViewDTO> findAllEvents(String search, String location, EventType type, EventStatus status, Pageable pageable);

    @Transactional(readOnly = true)
    Page<EventSimpleViewDTO> findAllEvents(String search, String location, EventType type, EventStatus status, 
                                           Instant dateFrom, Instant dateTo, Integer minVotes, Integer maxVotes, 
                                           String creatorUsername, String popularityFilter, Pageable pageable);

    @Transactional(readOnly = true)
    Page<EventSimpleViewDTO> findAllEvents(String search, String location, EventType type, EventStatus status, 
                                           Instant dateFrom, Instant dateTo, Integer minVotes, Integer maxVotes, 
                                           String creatorUsername, String popularityFilter, 
                                           String quickFilter, Long currentUserId, Pageable pageable);

    @Transactional(readOnly = true)
    List<EventSimpleViewDTO> getAllUserEvents(String username);

    @Transactional(readOnly = true)
    Map<String, Object> getEventsStatistics();

    @Transactional(readOnly = true)
    List<EventSimpleViewDTO> getRecommendedEvents(Long userId, int limit);

    @Transactional(readOnly = true)
    List<EventSimpleViewDTO> getSimilarEvents(Long eventId, EventType eventType, int limit);
}
