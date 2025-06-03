package smolyanVote.smolyanVote.services.interfaces;

import org.springframework.data.domain.Page;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.viewsAndDTO.CreateEventView;
import smolyanVote.smolyanVote.viewsAndDTO.EventSimpleViewDTO;
import smolyanVote.smolyanVote.viewsAndDTO.SimpleEventDetailViewDTO;

import java.util.List;

public interface SimpleEventService {

    @Transactional(readOnly = true)
    Page<EventSimpleViewDTO> getPaginatedEvents(int page, int size);

    @Transactional()
    List<SimpleEventDetailViewDTO> getAllEvents();

    SimpleEventDetailViewDTO getSimpleEventDetails(Long id);

    List<String> createEvent(CreateEventView dto, MultipartFile[] files, String positiveLabel,
                             String negativeLabel, String neutralLabel);

    @Transactional(readOnly = true)
    List<EventSimpleViewDTO> getAllUserEvents(String email);
}
