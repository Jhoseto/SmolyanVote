package smolyanVote.smolyanVote.services.interfaces;

import org.springframework.data.domain.Page;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.viewsAndDTO.CreateEventView;
import smolyanVote.smolyanVote.viewsAndDTO.SimpleEventDeteilDTO;

import java.util.List;

public interface EventService {

    @Transactional(readOnly = true)
    Page<SimpleEventDeteilDTO> getPaginatedEvents(int page, int size);

    List<SimpleEventDeteilDTO> getAllEvents();

    SimpleEventDeteilDTO getEventById(Long id);

    List<String> createEvent(CreateEventView dto,
                             MultipartFile[] files,
                             String positiveLabel,
                             String negativeLabel,
                             String neutralLabel);

    List<SimpleEventDeteilDTO> getUserEvents(String currentUser);
}
