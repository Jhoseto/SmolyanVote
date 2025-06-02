package smolyanVote.smolyanVote.services.serviceImpl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.models.MultiPollEntity;
import smolyanVote.smolyanVote.models.MultiPollImageEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.repositories.MultiPollRepository;
import smolyanVote.smolyanVote.repositories.MultiPollImageRepository;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.viewsAndDTO.CreateMultiPollView;
import smolyanVote.smolyanVote.services.interfaces.MultiPollService;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
public class MultiPollServiceImpl implements MultiPollService {

    private final MultiPollRepository multiPollRepository;
    private final MultiPollImageRepository imageRepository;
    private final UserService userService;
    private final ImageCloudinaryServiceImpl imageCloudinaryService;

    @Autowired
    public MultiPollServiceImpl(MultiPollRepository multiPollRepository,
                                MultiPollImageRepository imageRepository,
                                UserService userService,
                                ImageCloudinaryServiceImpl imageCloudinaryService) {
        this.multiPollRepository = multiPollRepository;
        this.imageRepository = imageRepository;
        this.userService = userService;
        this.imageCloudinaryService = imageCloudinaryService;
    }

    @Transactional
    @Override
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



}
