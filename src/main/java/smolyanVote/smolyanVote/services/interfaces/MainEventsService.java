package smolyanVote.smolyanVote.services.interfaces;

import org.springframework.data.domain.Page;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.viewsAndDTO.EventSimpleViewDTO;

import java.util.List;

public interface MainEventsService {


    @Transactional(readOnly = true)
    Page<EventSimpleViewDTO> getPaginatedAllEvents(int page, int size);

    Page<EventSimpleViewDTO> getPaginatedSimpleEvents(int page, int size);

    @Transactional(readOnly = true)
    Page<EventSimpleViewDTO> getPaginatedReferendumEvents(int page, int size);

    @Transactional(readOnly = true)
    Page<EventSimpleViewDTO> getPaginatedMultiPollEvents(int page, int size);

    @Transactional(readOnly = true)
    List<EventSimpleViewDTO> getAllUserEvents(String email);
}
