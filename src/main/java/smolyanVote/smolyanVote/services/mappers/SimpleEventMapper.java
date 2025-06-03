package smolyanVote.smolyanVote.services.mappers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import smolyanVote.smolyanVote.models.*;
import smolyanVote.smolyanVote.repositories.SimpleEventImageRepository;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.viewsAndDTO.SimpleEventDetailViewDTO;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class SimpleEventMapper {

    private final SimpleEventImageRepository imageRepository;
    private final UserRepository userRepository;

    @Autowired
    public SimpleEventMapper(SimpleEventImageRepository imageRepository,
                             UserRepository userRepository) {
        this.imageRepository = imageRepository;
        this.userRepository = userRepository;
    }

    public SimpleEventDetailViewDTO mapSimpleEventToView(SimpleEventEntity event) {
        Optional<UserEntity> user = userRepository.findByUsername(event.getCreatorName());
        SimpleEventDetailViewDTO view = new SimpleEventDetailViewDTO();
        view.setId(event.getId());
        view.setTitle(event.getTitle());
        view.setDescription(event.getDescription());
        view.setLocation(event.getLocation());
        view.setEventType(event.getEventType());
        view.setViewCounter(event.getViewCounter());

        // Автор
        user.ifPresent(view::setCreator);

        // Снимки
        List<SimpleEventImageEntity> images = imageRepository.findByEventId(event.getId());

        if (images != null && !images.isEmpty()) {
            List<String> imageUrls = new ArrayList<>();
            for (SimpleEventImageEntity image : images) {
                imageUrls.add(image.getImageUrl()); // Get the image URL
            }
            view.setImages(imageUrls);
        } else {
            view.setImages(List.of("/images/eventImages/defaultEvent.png"));
        }

        view.setCreatedAt(event.getCreatedAt());
        view.setYesVotes(event.getYesVotes());
        view.setNoVotes(event.getNoVotes());
        view.setNeutralVotes(event.getNeutralVotes());
        view.setTotalVotes(event.getTotalVotes());
        view.setPositiveLabel(event.getPositiveLabel());
        view.setNegativeLabel(event.getNegativeLabel());
        view.setNeutralLabel(event.getNeutralLabel());

        return view;
    }
}
