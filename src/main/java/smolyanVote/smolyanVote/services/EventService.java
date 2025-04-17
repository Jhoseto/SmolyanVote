package smolyanVote.smolyanVote.services;

import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.viewsAndDTO.CreateEventView;
import smolyanVote.smolyanVote.viewsAndDTO.EventView;

import java.util.List;

public interface EventService {
    List<EventView> getAllEvents();

    EventView getEventById(Long id);

    List<String> createEvent(CreateEventView dto, MultipartFile[] files);

    void deleteEvent(Long id);
}
