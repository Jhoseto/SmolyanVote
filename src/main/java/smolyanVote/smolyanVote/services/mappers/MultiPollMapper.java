package smolyanVote.smolyanVote.services.mappers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import smolyanVote.smolyanVote.models.MultiPollEntity;
import smolyanVote.smolyanVote.models.MultiPollImageEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.repositories.MultiPollImageRepository;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.viewsAndDTO.EventSimpleViewDTO;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class MultiPollMapper {


    private final UserRepository userRepository;
    private final MultiPollImageRepository multiPollImageRepository;


    @Autowired
    public MultiPollMapper(UserRepository userRepository,
                         MultiPollImageRepository multiPollImageRepository) {
        this.userRepository = userRepository;
        this.multiPollImageRepository = multiPollImageRepository;
    }

//    public EventSimpleViewDTO mapMultiPollToView(MultiPollEntity multiPoll) {
//        EventSimpleViewDTO multiPollDto = new EventSimpleViewDTO();
//        Optional<UserEntity> user = userRepository.findByUsername(multiPoll.getCreatorName());
//
//        // Автор
//        if (user.isPresent()) {
//            multiPollDto.setCreatorName(user.get());
//
//
//            // Снимки
//            List<MultiPollImageEntity> images = multiPollImageRepository.findByMultiPoll_Id(multiPoll.getId());
//
//            if (images != null && !images.isEmpty()) {
//                List<String> imageUrls = new ArrayList<>();
//                for (MultiPollImageEntity image : images) {
//                    imageUrls.add(image.getImageUrl());
//                }
//                multiPollDto.setImage(imageUrls);
//            } else {
//                multiPollDto.setImage(List.of("/images/eventImages/defaultEvent.png")); // Default изображение
//            }
//
//            // Присвояване на стойности
//            multiPollDto.setId(multiPoll.getId());
//            multiPollDto.setTitle(multiPoll.getTitle());
//            multiPollDto.setDescription(multiPoll.getDescription());
//            multiPollDto.setLocation(multiPoll.getLocation());
//            multiPollDto.setCreatedAt(multiPoll.getCreatedAt());
//            multiPollDto.setEventType(multiPoll.getEventType());
//            multiPollDto.setViewCounter(multiPoll.getViewCounter());
//            multiPollDto.setTotalVotes(multiPoll.getTotalVotes());
//        }
//
//        return multiPollDto;
//    }
}
