package smolyanVote.smolyanVote.services.mappers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import smolyanVote.smolyanVote.models.MultiPollEntity;
import smolyanVote.smolyanVote.models.MultiPollImageEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.repositories.MultiPollImageRepository;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.viewsAndDTO.MultiPollDetailViewDTO;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class MultiPollMapper {

    private final UserRepository userRepository;
    private final MultiPollImageRepository imageRepository;

    @Autowired
    public MultiPollMapper(UserRepository userRepository,
                           MultiPollImageRepository imageRepository) {
        this.userRepository = userRepository;
        this.imageRepository = imageRepository;
    }

    public MultiPollDetailViewDTO mapToDetailView(MultiPollEntity poll) {
        MultiPollDetailViewDTO dto = new MultiPollDetailViewDTO();

        dto.setId(poll.getId());
        dto.setTitle(poll.getTitle());
        dto.setDescription(poll.getDescription());
        dto.setCreatedAt(poll.getCreatedAt());
        dto.setLocation(poll.getLocation());
        dto.setTotalUsersVotes(poll.getTotalUsersVotes());
        dto.setViewCounter(poll.getViewCounter());

        // Събиране валидните (непразни) опции
        List<String> options = new ArrayList<>();
        if (poll.getOption1() != null && !poll.getOption1().isBlank()) options.add(poll.getOption1());
        if (poll.getOption2() != null && !poll.getOption2().isBlank()) options.add(poll.getOption2());
        if (poll.getOption3() != null && !poll.getOption3().isBlank()) options.add(poll.getOption3());
        if (poll.getOption4() != null && !poll.getOption4().isBlank()) options.add(poll.getOption4());
        if (poll.getOption5() != null && !poll.getOption5().isBlank()) options.add(poll.getOption5());
        if (poll.getOption6() != null && !poll.getOption6().isBlank()) options.add(poll.getOption6());
        if (poll.getOption7() != null && !poll.getOption7().isBlank()) options.add(poll.getOption7());
        if (poll.getOption8() != null && !poll.getOption8().isBlank()) options.add(poll.getOption8());
        if (poll.getOption9() != null && !poll.getOption9().isBlank()) options.add(poll.getOption9());
        if (poll.getOption10() != null && !poll.getOption10().isBlank()) options.add(poll.getOption10());

        dto.setOptionsText(options);

        // Creator
        Optional<UserEntity> userOpt = userRepository.findByUsername(poll.getCreatorName());
        userOpt.ifPresent(dto::setCreator);

        // Images
        List<MultiPollImageEntity> images = imageRepository.findByMultiPoll_Id(poll.getId());
        if (images != null && !images.isEmpty()) {
            List<String> urls = new ArrayList<>();
            for (MultiPollImageEntity img : images) {
                urls.add(img.getImageUrl());
            }
            dto.setImageUrls(urls);
        } else {
            dto.setImageUrls(List.of("/images/eventImages/defaultMultiPoll.jpg"));
        }

        return dto;
    }
}
