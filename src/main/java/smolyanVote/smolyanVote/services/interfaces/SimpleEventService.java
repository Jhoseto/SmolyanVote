package smolyanVote.smolyanVote.services.interfaces;

import org.springframework.data.domain.Page;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.viewsAndDTO.CreateEventView;
import smolyanVote.smolyanVote.viewsAndDTO.EventSimpleViewDTO;
import smolyanVote.smolyanVote.viewsAndDTO.SimpleEventDetailViewDTO;

import java.util.List;

public interface SimpleEventService {


    @Transactional()
    List<SimpleEventDetailViewDTO> getAllEvents();

    SimpleEventDetailViewDTO getSimpleEventDetails(Long id);

    /** @return the id of the newly created event (used by the JSON API to redirect to the detail page). */
    Long createEvent(CreateEventView dto, MultipartFile[] files, String positiveLabel,
                      String negativeLabel, String neutralLabel);

    /**
     * Admin inline edit: updates text fields/labels, removes images whose id
     * is in {@code deleteImageIds}, appends {@code newImages}.
     * @return the id of the updated event (used by the JSON API to re-fetch the fresh detail).
     */
    Long updateEvent(Long id, CreateEventView dto, MultipartFile[] newImages, String positiveLabel,
                      String negativeLabel, String neutralLabel, List<Long> deleteImageIds);

}
