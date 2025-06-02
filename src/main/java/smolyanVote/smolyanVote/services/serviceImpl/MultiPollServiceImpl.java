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

        // Опции
        poll.setOption1(dto.getOption1());
        poll.setOption2(dto.getOption2());
        poll.setOption3(dto.getOption3());
        poll.setOption4(dto.getOption4());
        poll.setOption5(dto.getOption5());
        poll.setOption6(dto.getOption6());
        poll.setOption7(dto.getOption7());
        poll.setOption8(dto.getOption8());
        poll.setOption9(dto.getOption9());
        poll.setOption10(dto.getOption10());




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
    }


}
