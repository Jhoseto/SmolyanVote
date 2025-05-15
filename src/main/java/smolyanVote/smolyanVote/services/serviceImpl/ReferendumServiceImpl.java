package smolyanVote.smolyanVote.services.serviceImpl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.models.CommentsEntity;
import smolyanVote.smolyanVote.models.ReferendumEntity;
import smolyanVote.smolyanVote.models.ReferendumImageEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.Locations;
import smolyanVote.smolyanVote.repositories.ReferendumImageRepository;
import smolyanVote.smolyanVote.repositories.ReferendumRepository;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.ReferendumService;
import smolyanVote.smolyanVote.viewsAndDTO.ReferendumDetailDTO;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ReferendumServiceImpl implements ReferendumService {

    private final ReferendumRepository referendumRepository;
    private final ReferendumImageRepository imageRepository;
    private final ImageStorageServiceImpl imageStorageService;
    private final UserRepository userRepository;
    private final CommentsServiceImpl commentsService;
    private final VoteServiceImpl referendumVoteService;

    public ReferendumServiceImpl(ReferendumRepository referendumRepository,
                                 ReferendumImageRepository imageRepository,
                                 ImageStorageServiceImpl imageStorageService,
                                 UserRepository userRepository,
                                 CommentsServiceImpl commentsService,
                                 VoteServiceImpl referendumVoteService) {
        this.referendumRepository = referendumRepository;
        this.imageRepository = imageRepository;
        this.imageStorageService = imageStorageService;
        this.userRepository = userRepository;
        this.commentsService = commentsService;
        this.referendumVoteService = referendumVoteService;
    }


    @Transactional
    @Override
    public void createReferendum(String topic,
                                 String description,
                                 Locations location,
                                 List<String> options,
                                 List<MultipartFile> images,
                                 UserEntity user) {
        ReferendumEntity referendum = new ReferendumEntity();
        referendum.setTitle(topic);
        referendum.setDescription(description);
        referendum.setLocation(location);
        referendum.setCreatorName(user.getUsername());
        referendum.setCreatedAt(Instant.now());
        user.setUserEventsCount(user.getUserEventsCount() + 1);

        // Задаване на до 10 опции
        for (int i = 0; i < options.size(); i++) {
            String option = options.get(i);
            switch (i) {
                case 0 -> referendum.setOption1(option);
                case 1 -> referendum.setOption2(option);
                case 2 -> referendum.setOption3(option);
                case 3 -> referendum.setOption4(option);
                case 4 -> referendum.setOption5(option);
                case 5 -> referendum.setOption6(option);
                case 6 -> referendum.setOption7(option);
                case 7 -> referendum.setOption8(option);
                case 8 -> referendum.setOption9(option);
                case 9 -> referendum.setOption10(option);
            }
        }

        // Запазване
        referendumRepository.save(referendum);
        userRepository.save(user);

        // Съхраняване на изображенията
        for (MultipartFile file : images) {
            if (file != null && !file.isEmpty()) {
                // След като референдумът е запазен, вземаме ID-то му
                Long referendumId = referendum.getId();

                String imagePath = imageStorageService.saveSingleReferendumImage(file, referendumId);

                ReferendumImageEntity image = new ReferendumImageEntity();
                image.setImageUrl(imagePath);
                image.setReferendum(referendum);
                imageRepository.save(image);
            }
        }
    }

    @Transactional
    @Override
    public Optional<ReferendumEntity> findById(Long id) {
        Optional<ReferendumEntity> referendum = referendumRepository.findById(id);
        referendum.ifPresent(r -> r.getImages().size()); // зарежда images

        return referendum;
    }


    @Transactional(readOnly = true)
    @Override
    public ReferendumDetailDTO getReferendumDetail(Long referendumId, String username) {
        Optional<ReferendumEntity> optionalReferendum = referendumRepository.findById(referendumId);
        if (optionalReferendum.isEmpty()) {
            return null;
        }

        ReferendumEntity referendum = optionalReferendum.get();

        Optional<UserEntity> user = userRepository.findByUsername(referendum.getCreatorName());

        List<String> imageUrls = referendum.getImages()
                .stream()
                .map(ReferendumImageEntity::getImageUrl)
                .toList();

        // Събиране на опции и гласове
        List<String> options = new ArrayList<>();
        List<Integer> votes = new ArrayList<>();

        if (referendum.getOption1() != null) { options.add(referendum.getOption1()); votes.add(referendum.getVotes1()); }
        if (referendum.getOption2() != null) { options.add(referendum.getOption2()); votes.add(referendum.getVotes2()); }
        if (referendum.getOption3() != null) { options.add(referendum.getOption3()); votes.add(referendum.getVotes3()); }
        if (referendum.getOption4() != null) { options.add(referendum.getOption4()); votes.add(referendum.getVotes4()); }
        if (referendum.getOption5() != null) { options.add(referendum.getOption5()); votes.add(referendum.getVotes5()); }
        if (referendum.getOption6() != null) { options.add(referendum.getOption6()); votes.add(referendum.getVotes6()); }
        if (referendum.getOption7() != null) { options.add(referendum.getOption7()); votes.add(referendum.getVotes7()); }
        if (referendum.getOption8() != null) { options.add(referendum.getOption8()); votes.add(referendum.getVotes8()); }
        if (referendum.getOption9() != null) { options.add(referendum.getOption9()); votes.add(referendum.getVotes9()); }
        if (referendum.getOption10() != null) { options.add(referendum.getOption10()); votes.add(referendum.getVotes10()); }

        int totalVotes = referendum.getTotalVotes();

        List<Integer> votePercentages = votes.stream()
                .map(v -> totalVotes == 0 ? 0 : (int) ((v * 100.0f) / totalVotes))
                .toList();

        Integer userVote = referendumVoteService.findVoteByReferendumIdAndUserEmail(referendumId, username);

        List<CommentsEntity> comments = commentsService.getCommentsForEvent(referendumId);

        return new ReferendumDetailDTO(referendum, user.orElse(null),
                imageUrls,
                options,
                votes,
                votePercentages,
                totalVotes,
                userVote,
                comments
        );
    }
}
