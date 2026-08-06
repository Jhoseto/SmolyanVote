package smolyanVote.smolyanVote.services.serviceImpl;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.annotations.LogActivity;
import smolyanVote.smolyanVote.models.*;
import smolyanVote.smolyanVote.models.enums.ActivityActionEnum;
import smolyanVote.smolyanVote.models.enums.ActivityTypeEnum;
import smolyanVote.smolyanVote.repositories.SimpleEventImageRepository;
import smolyanVote.smolyanVote.repositories.SimpleEventRepository;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.interfaces.SimpleEventService;
import smolyanVote.smolyanVote.services.interfaces.VoteService;
import smolyanVote.smolyanVote.services.mappers.SimpleEventMapper;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.services.support.EventImageDefaults;
import smolyanVote.smolyanVote.viewsAndDTO.CreateEventView;
import smolyanVote.smolyanVote.viewsAndDTO.SimpleEventDetailViewDTO;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SimpleEventServiceImpl implements SimpleEventService {

    private final SimpleEventRepository simpleEventRepository;
    private final SimpleEventImageRepository simpleEventImageRepository;
    private final UserRepository userRepository;
    private final SimpleEventMapper simpleEventMapper;
    private final UserService userService;
    private final ImageCloudinaryServiceImpl imageStorageService;

    private final VoteService voteService;


    public SimpleEventServiceImpl(
            SimpleEventRepository simpleEventRepository,
            SimpleEventImageRepository simpleEventImageRepository,
            UserRepository userRepository,
            SimpleEventMapper simpleEventMapper,
            UserService userService,
            ImageCloudinaryServiceImpl imageStorageService,
            VoteService voteService) {
        this.simpleEventRepository = simpleEventRepository;
        this.simpleEventImageRepository = simpleEventImageRepository;
        this.userRepository = userRepository;
        this.simpleEventMapper = simpleEventMapper;
        this.userService = userService;
        this.imageStorageService = imageStorageService;
        this.voteService = voteService;
    }


    @Transactional()
    @Override
    public List<SimpleEventDetailViewDTO> getAllEvents() {
        List<SimpleEventEntity> events = simpleEventRepository.findAll();

        return events.stream()
                .sorted(Comparator.comparing(SimpleEventEntity::getCreatedAt).reversed()) // Сортиране по дата
                .map(simpleEventMapper::mapSimpleEventToView) //  метода от EventMapper
                .collect(Collectors.toList());
    }



    @Transactional
    @Override
    @LogActivity(action = ActivityActionEnum.VIEW_EVENT, entityType = ActivityTypeEnum.SIMPLEEVENT,
            entityIdParam = "id", includeTitle = true, includeText = true)

    public SimpleEventDetailViewDTO getSimpleEventDetails(Long id) {
        UserEntity currentUser = userService.getCurrentUser();

        SimpleEventEntity event = simpleEventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Събитието не е намерено"));

        // Увеличаване на броя прегледи
        event.setViewCounter(event.getViewCounter() + 1);
        simpleEventRepository.save(event);

        // Мапване към DTO
        SimpleEventDetailViewDTO dto = simpleEventMapper.mapSimpleEventToView(event);

        // Проценти
        int totalVotes = dto.getTotalVotes();
        if (totalVotes > 0) {
            dto.setYesPercent(dto.getYesVotes() * 100 / totalVotes);
            dto.setNoPercent(dto.getNoVotes() * 100 / totalVotes);
            dto.setNeutralPercent(dto.getNeutralVotes() * 100 / totalVotes);
        } else {
            dto.setYesPercent(0);
            dto.setNoPercent(0);
            dto.setNeutralPercent(0);
        }
        // Глас на текущия потребител (ако е логнат)
        if (currentUser != null) {
            VoteSimpleEventEntity vote = voteService.findByUserIdAndEventId(currentUser.getId(), id);
            String voteValue = (vote != null) ? vote.getVoteValue() : null;
            dto.setCurrentUserVote(voteValue);
        } else {
            dto.setCurrentUserVote(null);
        }

        return dto;
    }


    @Transactional
    @Override
    @LogActivity(action = ActivityActionEnum.CREATE_SIMPLE_EVENT, entityType = ActivityTypeEnum.SIMPLEEVENT,
            details = "Title: {title}, Location: {location}", includeTitle = true, includeText = true)

    public Long createEvent(CreateEventView dto,
                            MultipartFile[] files,
                            String positiveLabel,
                            String negativeLabel,
                            String neutralLabel) {
        SimpleEventEntity simpleEventEntity = new SimpleEventEntity();
        UserEntity user = userService.getCurrentUser();

        simpleEventEntity.setTitle(dto.getTitle());
        simpleEventEntity.setDescription(dto.getDescription());
        simpleEventEntity.setCreatorName(user.getUsername());
        simpleEventEntity.setCreatedAt(Instant.now());
        simpleEventEntity.setLocation(dto.getLocation());
        simpleEventEntity.setPositiveLabel(positiveLabel);
        simpleEventEntity.setNegativeLabel(negativeLabel);
        simpleEventEntity.setNeutralLabel(neutralLabel);
        user.setUserEventsCount(user.getUserEventsCount() + 1);

        // Инициализиране на изображенията, ако колекцията е null
        if (simpleEventEntity.getImages() == null) {
            simpleEventEntity.setImages(new ArrayList<>());
        }

        // Записване на изображенията
        if (files != null && files.length > 0) {
            for (MultipartFile file : files) {
                if (file != null && !file.isEmpty()) {
                    // Взимаме ID на събитието след запазване в базата
                    SimpleEventEntity savedEvent = simpleEventRepository.save(simpleEventEntity);
                    String imagePath = imageStorageService.saveSingleImage(file, savedEvent.getId());

                    SimpleEventImageEntity imageEntity = new SimpleEventImageEntity();
                    imageEntity.setImageUrl(imagePath);
                    imageEntity.setEvent(savedEvent);
                    savedEvent.getImages().add(imageEntity);
                }
            }
        }

        // Ако няма качени изображения, добавяме default
        if (simpleEventEntity.getImages().isEmpty()) {
            SimpleEventImageEntity defaultImage = new SimpleEventImageEntity();
            defaultImage.setImageUrl(EventImageDefaults.SIMPLE_EVENT);
            defaultImage.setEvent(simpleEventEntity);
            simpleEventEntity.getImages().add(defaultImage);
        }

        // Записване на събитието заедно с изображенията
        SimpleEventEntity saved = simpleEventRepository.saveAndFlush(simpleEventEntity);
        userRepository.save(user);

        return saved.getId();
    }


    @Transactional
    @Override
    @LogActivity(action = ActivityActionEnum.EDIT_EVENT, entityType = ActivityTypeEnum.SIMPLEEVENT,
            entityIdParam = "id", details = "Title: {title}, Location: {location}", includeTitle = true)

    public Long updateEvent(Long id,
                            CreateEventView dto,
                            MultipartFile[] newImages,
                            String positiveLabel,
                            String negativeLabel,
                            String neutralLabel,
                            List<Long> deleteImageIds) {
        SimpleEventEntity event = simpleEventRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Събитието не е намерено."));

        if (event.getImages() == null) {
            event.setImages(new ArrayList<>());
        }

        event.setTitle(dto.getTitle());
        event.setDescription(dto.getDescription());
        event.setLocation(dto.getLocation());
        event.setPositiveLabel(positiveLabel);
        event.setNegativeLabel(negativeLabel);
        event.setNeutralLabel(neutralLabel);

        if (deleteImageIds != null && !deleteImageIds.isEmpty()) {
            List<SimpleEventImageEntity> toRemove = event.getImages().stream()
                    .filter(img -> deleteImageIds.contains(img.getId()))
                    .toList();
            toRemove.forEach(img -> imageStorageService.deleteImage(img.getImageUrl()));
            event.getImages().removeAll(toRemove);
        }

        if (newImages != null) {
            boolean hasNewUpload = false;
            for (MultipartFile file : newImages) {
                if (file != null && !file.isEmpty()) {
                    hasNewUpload = true;
                    break;
                }
            }
            if (hasNewUpload) {
                removePlaceholderImages(event);
            }
            List<SimpleEventImageEntity> added = new ArrayList<>();
            for (MultipartFile file : newImages) {
                if (file != null && !file.isEmpty()) {
                    String imagePath = imageStorageService.saveSingleImage(file, event.getId());
                    SimpleEventImageEntity imageEntity = new SimpleEventImageEntity();
                    imageEntity.setImageUrl(imagePath);
                    imageEntity.setEvent(event);
                    event.getImages().add(imageEntity);
                    added.add(imageEntity);
                }
            }
            if (!added.isEmpty()) {
                simpleEventImageRepository.saveAll(added);
            }
        }

        SimpleEventEntity saved = simpleEventRepository.saveAndFlush(event);
        return saved.getId();
    }

    private static void removePlaceholderImages(SimpleEventEntity event) {
        if (event.getImages() == null) {
            event.setImages(new ArrayList<>());
            return;
        }
        event.getImages().removeIf(img -> EventImageDefaults.isPlaceholder(img.getImageUrl()));
    }

}
