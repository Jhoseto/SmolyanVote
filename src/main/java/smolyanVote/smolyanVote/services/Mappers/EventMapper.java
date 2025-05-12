package smolyanVote.smolyanVote.services.Mappers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import smolyanVote.smolyanVote.models.EventEntity;
import smolyanVote.smolyanVote.models.EventImageEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.repositories.EventImageRepository;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.viewsAndDTO.EventView;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class EventMapper {

    private final EventImageRepository imageRepository;
    private final UserRepository userRepository;

    @Autowired
    public EventMapper(EventImageRepository imageRepository,
                       UserRepository userRepository) {
        this.imageRepository = imageRepository;
        this.userRepository = userRepository;
    }

    public EventView mapToView(EventEntity event) {
        Optional<UserEntity> user = userRepository.findByUsername(event.getCreatorName());
        EventView view = new EventView();
        view.setId(event.getId());
        view.setTitle(event.getTitle());
        view.setDescription(event.getDescription());
        view.setLocation(event.getLocation());

        // Автор
        if (user.isPresent()) {
            view.setCreatorName(user.get().getUsername());
            view.setCreatorImage(user.get().getImageUrl());

            userRepository.findByUsername(event.getCreatorName())
                    .ifPresent(u -> view.setCreatorOnline(u.getOnlineStatus()));
        }

        // Снимки
        List<EventImageEntity> images = imageRepository.findByEventId(event.getId());

        if (images != null && !images.isEmpty()) {
            List<String> imageUrls = new ArrayList<>();
            for (EventImageEntity image : images) {
                imageUrls.add(image.getImageUrl()); // Get the image URL
            }
            view.setImageUrls(imageUrls);
        } else {
            view.setImageUrls(List.of("/images/eventImages/defaultEvent.png"));
        }

        view.setCreatedAt(event.getCreatedAt());
        view.setYesVotes(event.getYesVotes());
        view.setNoVotes(event.getNoVotes());
        view.setNeutralVotes(event.getNeutralVotes());
        view.setTotalVotes(event.getTotalVotes());

        return view;
    }
}
