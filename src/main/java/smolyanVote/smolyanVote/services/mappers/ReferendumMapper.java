package smolyanVote.smolyanVote.services.mappers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import smolyanVote.smolyanVote.models.ReferendumEntity;
import smolyanVote.smolyanVote.models.ReferendumImageEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.repositories.ReferendumImageRepository;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.viewsAndDTO.EventSimpleViewDTO;
import smolyanVote.smolyanVote.viewsAndDTO.ReferendumDetailViewDTO;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ReferendumMapper {

    private final UserRepository userRepository;
    private final ReferendumImageRepository referendumImageRepository;

    @Autowired
    public ReferendumMapper(UserRepository userRepository,
                            ReferendumImageRepository referendumImageRepository) {
        this.userRepository = userRepository;
        this.referendumImageRepository = referendumImageRepository;
    }

    public ReferendumDetailViewDTO mapReferendumToSimpleView(ReferendumEntity referendum) {
        ReferendumDetailViewDTO view = new ReferendumDetailViewDTO();
        Optional<UserEntity> user = userRepository.findByUsername(referendum.getCreatorName());

        // Автор
        user.ifPresent(userEntity -> view.setCreatorName(userEntity.getUsername()));

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

        view.setTitle(referendum.getTitle());
        view.setDescription(referendum.getDescription());
        view.setLocation(referendum.getLocation());
        view.setCreatedAt(referendum.getCreatedAt());
        view.setEventType(referendum.getEventType());
        view.setViewCounter(referendum.getViewCounter());
        view.setTotalVotes(referendum.getTotalVotes());


        return view;
    }
}
