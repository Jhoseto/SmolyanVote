package smolyanVote.smolyanVote.services.mappers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import smolyanVote.smolyanVote.models.*;
import smolyanVote.smolyanVote.repositories.ReferendumImageRepository;
import smolyanVote.smolyanVote.repositories.MultiPollImageRepository;
import smolyanVote.smolyanVote.repositories.SimpleEventImageRepository;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.support.EventImageDefaults;
import smolyanVote.smolyanVote.viewsAndDTO.EventSimpleViewDTO;

import java.util.List;

@Service
public class AllEventsSimplePreviewMapper {

    private final UserRepository userRepository;
    private final ReferendumImageRepository referendumImageRepository;
    private final MultiPollImageRepository multiPollImageRepository;
    private final SimpleEventImageRepository simpleEventImageRepository;

    @Autowired
    public AllEventsSimplePreviewMapper(
            UserRepository userRepository,
            ReferendumImageRepository referendumImageRepository,
            MultiPollImageRepository multiPollImageRepository,
            SimpleEventImageRepository simpleEventImageRepository
    ) {
        this.userRepository = userRepository;
        this.referendumImageRepository = referendumImageRepository;
        this.multiPollImageRepository = multiPollImageRepository;
        this.simpleEventImageRepository = simpleEventImageRepository;
    }

    public EventSimpleViewDTO mapSimpleEventToSimpleView(SimpleEventEntity event) {
        UserEntity user = userRepository.findByUsername(event.getCreatorName())
                .orElse(null); // Handle missing user gracefully

        EventSimpleViewDTO view = new EventSimpleViewDTO();
        view.setId(event.getId());
        view.setEventType(event.getEventType());
        view.setEventStatus(event.getEventStatus());
        view.setTitle(event.getTitle());
        view.setDescription(event.getDescription());
        view.setLocation(event.getLocation());
        view.setViewCounter(event.getViewCounter());
        view.setCreatedAt(event.getCreatedAt());
        view.setCreatorName(user != null ? user.getUsername() : event.getCreatorName());
        // Нормализираме празни стрингове към null за правилно показване на placeholder аватари
        String imageUrl = user != null ? user.getImageUrl() : null;
        view.setCreatorImage(imageUrl != null && !imageUrl.trim().isEmpty() ? imageUrl : null);
        view.setCreatorOnlineStatus(user != null ? user.getOnlineStatus() : 0);
        view.setTotalVotes(event.getTotalVotes());

        view.setImages(resolvePreviewImages(
                simpleEventImageRepository.findByEventId(event.getId()).stream()
                        .map(SimpleEventImageEntity::getImageUrl)
                        .toList(),
                EventImageDefaults.SIMPLE_EVENT));

        return view;
    }

    public EventSimpleViewDTO mapReferendumToSimpleView(ReferendumEntity referendum) {
        UserEntity user = userRepository.findByUsername(referendum.getCreatorName())
                .orElse(null); // Handle missing user gracefully

        EventSimpleViewDTO view = new EventSimpleViewDTO();
        view.setId(referendum.getId());
        view.setEventType(referendum.getEventType());
        view.setEventStatus(referendum.getEventStatus());
        view.setTitle(referendum.getTitle());
        view.setDescription(referendum.getDescription());
        view.setLocation(referendum.getLocation());
        view.setViewCounter(referendum.getViewCounter());
        view.setCreatedAt(referendum.getCreatedAt());
        view.setCreatorName(user != null ? user.getUsername() : referendum.getCreatorName());
        // Нормализираме празни стрингове към null за правилно показване на placeholder аватари
        String imageUrl = user != null ? user.getImageUrl() : null;
        view.setCreatorImage(imageUrl != null && !imageUrl.trim().isEmpty() ? imageUrl : null);
        view.setCreatorOnlineStatus(user != null ? user.getOnlineStatus() : 0);
        view.setTotalVotes(referendum.getTotalVotes());

        view.setImages(resolvePreviewImages(
                referendumImageRepository.findByReferendumId(referendum.getId()).stream()
                        .map(ReferendumImageEntity::getImageUrl)
                        .toList(),
                EventImageDefaults.REFERENDUM));

        return view;
    }

    public EventSimpleViewDTO mapMultiPollToSimpleView(MultiPollEntity multiPoll) {
        UserEntity user = userRepository.findByUsername(multiPoll.getCreatorName())
                .orElse(null); // Handle missing user gracefully

        EventSimpleViewDTO view = new EventSimpleViewDTO();
        view.setId(multiPoll.getId());
        view.setEventType(multiPoll.getEventType());
        view.setEventStatus(multiPoll.getEventStatus());
        view.setTitle(multiPoll.getTitle());
        view.setDescription(multiPoll.getDescription());
        view.setLocation(multiPoll.getLocation());
        view.setViewCounter(multiPoll.getViewCounter());
        view.setCreatedAt(multiPoll.getCreatedAt());
        view.setCreatorName(user != null ? user.getUsername() : multiPoll.getCreatorName());
        // Нормализираме празни стрингове към null за правилно показване на placeholder аватари
        String imageUrl = user != null ? user.getImageUrl() : null;
        view.setCreatorImage(imageUrl != null && !imageUrl.trim().isEmpty() ? imageUrl : null);
        view.setCreatorOnlineStatus(user != null ? user.getOnlineStatus() : 0);
        view.setTotalVotes(multiPoll.getTotalVotes());

        view.setImages(resolvePreviewImages(
                multiPollImageRepository.findByMultiPoll_Id(multiPoll.getId()).stream()
                        .map(MultiPollImageEntity::getImageUrl)
                        .toList(),
                EventImageDefaults.MULTI_POLL));

        return view;
    }

    private static List<String> resolvePreviewImages(List<String> storedUrls, String fallback) {
        List<String> real = storedUrls == null ? List.of() : storedUrls.stream()
                .filter(url -> !EventImageDefaults.isPlaceholder(url))
                .toList();
        return real.isEmpty() ? List.of(fallback) : real;
    }
}
