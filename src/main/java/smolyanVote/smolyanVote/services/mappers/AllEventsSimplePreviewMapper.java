package smolyanVote.smolyanVote.services.mappers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import smolyanVote.smolyanVote.models.*;
import smolyanVote.smolyanVote.repositories.ReferendumImageRepository;
import smolyanVote.smolyanVote.repositories.MultiPollImageRepository;
import smolyanVote.smolyanVote.repositories.SimpleEventImageRepository;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.viewsAndDTO.EventSimpleViewDTO;

import java.util.ArrayList;
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
                .orElseThrow(() -> new IllegalStateException("User not found: " + event.getCreatorName()));

        EventSimpleViewDTO view = new EventSimpleViewDTO();
        view.setId(event.getId());
        view.setEventType(event.getEventType());
        view.setTitle(event.getTitle());
        view.setDescription(event.getDescription());
        view.setLocation(event.getLocation());
        view.setViewCounter(event.getViewCounter());
        view.setCreatedAt(event.getCreatedAt());
        view.setCreatorName(user.getUsername());
        view.setCreatorImage(user.getImageUrl());
        view.setTotalVotes(event.getTotalVotes());

        List<SimpleEventImageEntity> images = simpleEventImageRepository.findByEventId(event.getId());
        if (images != null && !images.isEmpty()) {
            List<String> imageUrls = new ArrayList<>();
            for (SimpleEventImageEntity image : images) {
                imageUrls.add(image.getImageUrl());
            }
            view.setImages(imageUrls);
        } else {
            view.setImages(List.of("/images/eventImages/defaultEvent.png"));
        }

        return view;
    }

    public EventSimpleViewDTO mapReferendumToSimpleView(ReferendumEntity referendum) {
        UserEntity user = userRepository.findByUsername(referendum.getCreatorName())
                .orElseThrow(() -> new IllegalStateException("User not found: " + referendum.getCreatorName()));

        EventSimpleViewDTO view = new EventSimpleViewDTO();
        view.setId(referendum.getId());
        view.setEventType(referendum.getEventType());
        view.setTitle(referendum.getTitle());
        view.setDescription(referendum.getDescription());
        view.setLocation(referendum.getLocation());
        view.setViewCounter(referendum.getViewCounter());
        view.setCreatedAt(referendum.getCreatedAt());
        view.setCreatorName(user.getUsername());
        view.setCreatorImage(user.getImageUrl());
        view.setTotalVotes(referendum.getTotalVotes());

        List<ReferendumImageEntity> images = referendumImageRepository.findByReferendumId(referendum.getId());
        if (images != null && !images.isEmpty()) {
            List<String> imageUrls = new ArrayList<>();
            for (ReferendumImageEntity image : images) {
                imageUrls.add(image.getImageUrl());
            }
            view.setImages(imageUrls);
        } else {
            view.setImages(List.of("/images/eventImages/defaultEvent.png"));
        }

        return view;
    }

    public EventSimpleViewDTO mapMultiPollToSimpleView(MultiPollEntity multiPoll) {
        UserEntity user = userRepository.findByUsername(multiPoll.getCreatorName())
                .orElseThrow(() -> new IllegalStateException("User not found: " + multiPoll.getCreatorName()));

        EventSimpleViewDTO view = new EventSimpleViewDTO();
        view.setId(multiPoll.getId());
        view.setEventType(multiPoll.getEventType());
        view.setTitle(multiPoll.getTitle());
        view.setDescription(multiPoll.getDescription());
        view.setLocation(multiPoll.getLocation());
        view.setViewCounter(multiPoll.getViewCounter());
        view.setCreatedAt(multiPoll.getCreatedAt());
        view.setCreatorName(user.getUsername());
        view.setCreatorImage(user.getImageUrl());
        view.setTotalVotes(multiPoll.getTotalVotes());

        List<MultiPollImageEntity> images = multiPollImageRepository.findByMultiPoll_Id(multiPoll.getId());
        if (images != null && !images.isEmpty()) {
            List<String> imageUrls = new ArrayList<>();
            for (MultiPollImageEntity image : images) {
                imageUrls.add(image.getImageUrl());
            }
            view.setImages(imageUrls);
        } else {
            view.setImages(List.of("/images/eventImages/defaultEvent.png"));
        }

        return view;
    }
}
