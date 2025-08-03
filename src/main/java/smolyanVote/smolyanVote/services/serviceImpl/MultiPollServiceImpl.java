package smolyanVote.smolyanVote.services.serviceImpl;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.annotations.LogActivity;
import smolyanVote.smolyanVote.models.MultiPollEntity;
import smolyanVote.smolyanVote.models.MultiPollImageEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.VoteMultiPollEntity;
import smolyanVote.smolyanVote.repositories.MultiPollRepository;
import smolyanVote.smolyanVote.repositories.MultiPollImageRepository;
import smolyanVote.smolyanVote.repositories.VoteMultiPollRepository;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.services.mappers.MultiPollMapper;
import smolyanVote.smolyanVote.viewsAndDTO.CreateMultiPollView;
import smolyanVote.smolyanVote.services.interfaces.MultiPollService;
import smolyanVote.smolyanVote.viewsAndDTO.MultiPollDetailViewDTO;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
public class MultiPollServiceImpl implements MultiPollService {

    private final MultiPollRepository multiPollRepository;
    private final MultiPollImageRepository imageRepository;
    private final UserService userService;
    private final ImageCloudinaryServiceImpl imageCloudinaryService;
    private final MultiPollMapper multiPollMapper;
    private final VoteMultiPollRepository voteMultiPollRepository;

    @Autowired
    public MultiPollServiceImpl(MultiPollRepository multiPollRepository,
                                MultiPollImageRepository imageRepository,
                                UserService userService,
                                ImageCloudinaryServiceImpl imageCloudinaryService,
                                MultiPollMapper multiPollMapper,
                                VoteMultiPollRepository voteMultiPollRepository) {
        this.multiPollRepository = multiPollRepository;
        this.imageRepository = imageRepository;
        this.userService = userService;
        this.imageCloudinaryService = imageCloudinaryService;
        this.multiPollMapper = multiPollMapper;
        this.voteMultiPollRepository = voteMultiPollRepository;
    }

    @Transactional
    @Override
    @LogActivity
    public void createMultiPoll(CreateMultiPollView dto) {
        MultiPollEntity poll = new MultiPollEntity();
        UserEntity currentUser = userService.getCurrentUser();

        poll.setTitle(dto.getTitle());
        poll.setDescription(dto.getDescription());
        poll.setLocation(dto.getLocation());
        poll.setCreatedAt(Instant.now());
        poll.setCreatorName(currentUser.getUsername());

        List<String> options = dto.getOptions()
                .stream()
                .filter(opt -> opt != null && !opt.trim().isEmpty())
                .toList();

        if (!options.isEmpty()) poll.setOption1(options.get(0));
        if (options.size() > 1) poll.setOption2(options.get(1));
        if (options.size() > 2) poll.setOption3(options.get(2));
        if (options.size() > 3) poll.setOption4(options.get(3));
        if (options.size() > 4) poll.setOption5(options.get(4));
        if (options.size() > 5) poll.setOption6(options.get(5));
        if (options.size() > 6) poll.setOption7(options.get(6));
        if (options.size() > 7) poll.setOption8(options.get(7));
        if (options.size() > 8) poll.setOption9(options.get(8));
        if (options.size() > 9) poll.setOption10(options.get(9));

        MultiPollEntity savedPoll = multiPollRepository.save(poll);

        List<MultipartFile> files = List.of(dto.getImage1(), dto.getImage2(), dto.getImage3());
        List<MultiPollImageEntity> imageEntities = new ArrayList<>();

        for (MultipartFile file : files) {
            if (file != null && !file.isEmpty()) {
                String imageUrl = imageCloudinaryService.saveMultiPollImage(file, savedPoll.getId());

                MultiPollImageEntity imageEntity = new MultiPollImageEntity();
                imageEntity.setImageUrl(imageUrl);
                imageEntity.setMultiPoll(savedPoll);

                imageEntities.add(imageEntity);
            }
        }

        imageRepository.saveAll(imageEntities);
        savedPoll.setImages(imageEntities);
        multiPollRepository.save(savedPoll);
    }





    @Transactional
    @Override
    public MultiPollDetailViewDTO getMultiPollDetail(Long id) {
        // Вземане на анкетата
        MultiPollEntity poll = multiPollRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Анкетата не е намерена"));

        poll.setViewCounter(poll.getViewCounter() +1);

        // Текущ потребител (може да върнеш null ако е анонимен)
        UserEntity currentUser = userService.getCurrentUser();

        // Мапване на основната структура (заглавие, описание, локация и т.н.)
        MultiPollDetailViewDTO dto = multiPollMapper.mapToDetailView(poll);


        // Взимане на опциите
        List<String> options = dto.getOptionsText();
        if (options == null || options.isEmpty()) {
            dto.setVotesForOptions(List.of());
            dto.setVotePercentages(List.of());
            dto.setTotalVotes(0);
            return dto;
        }

        List<Integer> voteCounts = new ArrayList<>();
        int totalVotes = 0;

        // Изчисляване на брой гласове за всяка опция
        for (String option : options) {
            int count = voteMultiPollRepository.countByMultiPoll_IdAndOptionText(poll.getId(), option);
            voteCounts.add(count);
            totalVotes += count;
        }

        dto.setVotesForOptions(voteCounts);
        dto.setTotalVotes(totalVotes);

        // Изчисляване на проценти за всяка опция
        int finalTotalVotes = totalVotes;
        List<Integer> percentages = voteCounts.stream()
                .map(count -> finalTotalVotes == 0 ? 0 : (int) Math.round((count * 100.0) / finalTotalVotes))
                .toList();
        dto.setVotePercentages(percentages);

        // Глас(ове) на текущия потребител (ако е логнат)
        if (currentUser != null) {
            List<VoteMultiPollEntity> userVotes =
                    voteMultiPollRepository.findAllByMultiPoll_IdAndUser_Id(poll.getId(), currentUser.getId());

            if (!userVotes.isEmpty()) {
                List<String> votedOptions = userVotes.stream().map(VoteMultiPollEntity::getOptionText).toList();
                dto.setCurrentUserVotes(votedOptions);

                // По избор: само първият индекс (1-based) за съвместимост
                String firstOption = votedOptions.get(0);
                int index = options.indexOf(firstOption);
                dto.setCurrentUserVote(index >= 0 ? index + 1 : null);
            }
        }
        multiPollRepository.save(poll);
        return dto;
    }



}
