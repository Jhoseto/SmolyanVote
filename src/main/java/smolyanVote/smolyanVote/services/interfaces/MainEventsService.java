package smolyanVote.smolyanVote.services.interfaces;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.enums.EventStatus;
import smolyanVote.smolyanVote.models.enums.EventType;
import smolyanVote.smolyanVote.viewsAndDTO.EventSimpleViewDTO;

import java.util.List;

public interface MainEventsService {


    @Transactional(readOnly = true)
    Page<EventSimpleViewDTO> findAllEvents(String search, String location, EventType type, EventStatus status, Pageable pageable);

    @Transactional(readOnly = true)
    List<EventSimpleViewDTO> getAllUserEvents(String email);
}
