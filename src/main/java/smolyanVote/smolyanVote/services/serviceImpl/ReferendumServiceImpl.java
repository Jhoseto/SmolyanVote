package smolyanVote.smolyanVote.services.serviceImpl;

import org.antlr.v4.runtime.misc.LogManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.models.ReferendumEntity;
import smolyanVote.smolyanVote.models.ReferendumImageEntity;
import smolyanVote.smolyanVote.models.SimpleEventImageEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.enums.Locations;
import smolyanVote.smolyanVote.repositories.ReferendumImageRepository;
import smolyanVote.smolyanVote.repositories.ReferendumRepository;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.ReferendumService;

import java.time.Instant;
import java.util.List;

@Service
public class ReferendumServiceImpl implements ReferendumService {

    private final ReferendumRepository referendumRepository;
    private final ReferendumImageRepository imageRepository;
    private final ImageStorageServiceImpl imageStorageService;
    private final UserRepository userRepository;

    public ReferendumServiceImpl(ReferendumRepository referendumRepository,
                                 ReferendumImageRepository imageRepository,
                                 ImageStorageServiceImpl imageStorageService,
                                 UserRepository userRepository) {
        this.referendumRepository = referendumRepository;
        this.imageRepository = imageRepository;
        this.imageStorageService = imageStorageService;
        this.userRepository = userRepository;
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

}
