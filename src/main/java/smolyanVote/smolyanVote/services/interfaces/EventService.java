package smolyanVote.smolyanVote.services.interfaces;

import org.springframework.data.domain.Page;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.viewsAndDTO.CreateEventView;
import smolyanVote.smolyanVote.viewsAndDTO.EventView;

import java.util.List;

public interface EventService {

    @Transactional(readOnly = true)
    Page<EventView> getPaginatedEvents(int page, int size);

    List<EventView> getAllEvents();

    EventView getEventById(Long id);

    List<String> createEvent(CreateEventView dto,
                             MultipartFile[] files,
                             String positiveLabel,
                             String negativeLabel,
                             String neutralLabel);

    List<EventView> getUserEvents(String currentUser);
}
