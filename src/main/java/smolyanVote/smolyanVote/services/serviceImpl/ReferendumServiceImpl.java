package smolyanVote.smolyanVote.services.serviceImpl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.models.*;
import smolyanVote.smolyanVote.models.enums.EventType;
import smolyanVote.smolyanVote.models.enums.Locations;
import smolyanVote.smolyanVote.repositories.ReferendumImageRepository;
import smolyanVote.smolyanVote.repositories.ReferendumRepository;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.interfaces.CommentsService;
import smolyanVote.smolyanVote.services.interfaces.ReferendumService;
import smolyanVote.smolyanVote.services.mappers.ReferendumMapper;
import smolyanVote.smolyanVote.viewsAndDTO.ReferendumDetailViewDTO;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ReferendumServiceImpl implements ReferendumService {

    private final ReferendumRepository referendumRepository;
    private final ReferendumImageRepository imageRepository;
    private final ImageCloudinaryServiceImpl imageStorageService;
    private final UserRepository userRepository;
    private final CommentsService commentsService;
    private final VoteServiceImpl voteService;
    private final ReferendumMapper referendumMapper;

    public ReferendumServiceImpl(ReferendumRepository referendumRepository,
                                 ReferendumImageRepository imageRepository,
                                 ImageCloudinaryServiceImpl imageStorageService,
                                 UserRepository userRepository,
                                 CommentsServiceImpl commentsService,
                                 VoteServiceImpl voteService, ReferendumMapper referendumMapper)
    {
        this.referendumRepository = referendumRepository;
        this.imageRepository = imageRepository;
        this.imageStorageService = imageStorageService;
        this.userRepository = userRepository;
        this.commentsService = commentsService;
        this.voteService = voteService;
        this.referendumMapper = referendumMapper;
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
    public ReferendumDetailViewDTO getReferendumDetail(Long referendumId, Long userId) {
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

        // Увеличаваме броя на прегледите
        referendum.setViewCounter(referendum.getViewCounter() + 1);
        referendumRepository.save(referendum);


        int totalVotes = referendum.getTotalVotes();

        List<Integer> votePercentages = votes.stream()
                .map(v -> totalVotes == 0 ? 0 : (int) Math.round((v * 100.0) / totalVotes))
                .toList();

        // взимане на стойността от userVote
        VoteReferendumEntity userVote = voteService.findByUserIdAndReferendumId(referendumId, userId);
        Integer userVoteValue = userVote.getVoteValue();

        // Коментари
        List<CommentsEntity> comments = commentsService.getCommentsForTarget(referendumId, EventType.REFERENDUM);

        ReferendumDetailViewDTO dto = new ReferendumDetailViewDTO();
        dto.setOptions(options);
        dto.setVotes(votes);
        dto.setVotePercentages(votePercentages);
        dto.setImageUrls(imageUrls);
        dto.setUserVote(userVoteValue);
        dto.setComments(comments);
        dto.setCreatorName(user.get().getUsername());

        return dto;

    }
}
