package smolyanVote.smolyanVote.services.mappers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import smolyanVote.smolyanVote.models.*;
import smolyanVote.smolyanVote.repositories.EventImageRepository;
import smolyanVote.smolyanVote.repositories.ReferendumImageRepository;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.viewsAndDTO.EventView;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class EventMapper {

    private final EventImageRepository imageRepository;
    private final UserRepository userRepository;
    private final ReferendumImageRepository referendumImageRepository;

    @Autowired
    public EventMapper(EventImageRepository imageRepository,
                       UserRepository userRepository,
                       ReferendumImageRepository referendumImageRepository)
    {
        this.imageRepository = imageRepository;
        this.userRepository = userRepository;
        this.referendumImageRepository = referendumImageRepository;
    }

    public EventView mapToView(SimpleEventEntity event) {
        Optional<UserEntity> user = userRepository.findByUsername(event.getCreatorName());
        EventView view = new EventView();
        view.setId(event.getId());
        view.setTitle(event.getTitle());
        view.setDescription(event.getDescription());
        view.setLocation(event.getLocation());
        view.setEventType(event.getEventType());
        view.setViewCounter(event.getViewCounter());

        // Автор
        if (user.isPresent()) {
            view.setCreatorName(user.get().getUsername());
            view.setCreatorImage(user.get().getImageUrl());

            userRepository.findByUsername(event.getCreatorName())
                    .ifPresent(u -> view.setCreatorOnline(u.getOnlineStatus()));
        }

        // Снимки
        List<SimpleEventImageEntity> images = imageRepository.findByEventId(event.getId());

        if (images != null && !images.isEmpty()) {
            List<String> imageUrls = new ArrayList<>();
            for (SimpleEventImageEntity image : images) {
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
        view.setPositiveLabel(event.getPositiveLabel());
        view.setNegativeLabel(event.getNegativeLabel());
        view.setNeutralLabel(event.getNeutralLabel());

        return view;
    }



    public EventView mapReferendumToView(ReferendumEntity referendum) {
        EventView view = new EventView();
        Optional<UserEntity> user = userRepository.findByUsername(referendum.getCreatorName());

        // Автор
        if (user.isPresent()) {
            view.setCreatorName(user.get().getUsername());
            view.setCreatorImage(user.get().getImageUrl());

            userRepository.findByUsername(referendum.getCreatorName())
                    .ifPresent(u -> view.setCreatorOnline(u.getOnlineStatus()));
        }

        // Снимки
        List<ReferendumImageEntity> images = referendumImageRepository.findByReferendumId(referendum.getId());

        if (images != null && !images.isEmpty()) {
            List<String> imageUrls = new ArrayList<>();
            for (ReferendumImageEntity image : images) {
                imageUrls.add(image.getImageUrl()); // Вземаме URL на всяка снимка
            }
            view.setImageUrls(imageUrls);
        } else {
            view.setImageUrls(List.of("/images/eventImages/defaultEvent.png")); // Default изображение
        }

        // Присвояване на стойности
        view.setId(referendum.getId());
        view.setTitle(referendum.getTitle());
        view.setDescription(referendum.getDescription());
        view.setLocation(referendum.getLocation());
        view.setCreatedAt(referendum.getCreatedAt());
        view.setEventType(referendum.getEventType());

        return view;
    }
}
