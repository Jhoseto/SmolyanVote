package smolyanVote.smolyanVote.services.serviceImpl;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.data.domain.*;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.models.ReferendumEntity;
import smolyanVote.smolyanVote.models.SimpleEventEntity;
import smolyanVote.smolyanVote.models.SimpleEventImageEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.repositories.SimpleEventRepository;
import smolyanVote.smolyanVote.repositories.ReferendumRepository;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.EventService;
import smolyanVote.smolyanVote.services.Mappers.EventMapper;
import smolyanVote.smolyanVote.services.UserService;
import smolyanVote.smolyanVote.viewsAndDTO.CreateEventView;
import smolyanVote.smolyanVote.viewsAndDTO.EventView;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class EventServiceImpl implements EventService {

    private final SimpleEventRepository simpleEventRepository;
    private final UserRepository userRepository;
    private final EventMapper eventMapper;
    private final UserService userService;
    private final ImageCloudinaryServiceImpl imageStorageService;
    private final ReferendumRepository referendumRepository;

    @Autowired
    public EventServiceImpl(SimpleEventRepository simpleEventRepository,
                            UserRepository userRepository,
                            EventMapper eventMapper,
                            UserService userService,
                            ImageCloudinaryServiceImpl imageStorageService,
                            ReferendumRepository referendumRepository) {
        this.simpleEventRepository = simpleEventRepository;
        this.userRepository = userRepository;
        this.eventMapper = eventMapper;
        this.userService = userService;
        this.imageStorageService = imageStorageService;
        this.referendumRepository = referendumRepository;
    }


    @Transactional(readOnly = true)
    @Override
    public Page<EventView> getPaginatedEvents(int page, int size) {
        // Взимане на всички SimpleEventEntity и ReferendumEntity
        List<SimpleEventEntity> simpleEvents = simpleEventRepository.findAll();
        List<ReferendumEntity> referendums = referendumRepository.findAll();

        // Мапваме към общия EventView (или създай подходящ метод)
        List<EventView> allEvents = new ArrayList<>();
        allEvents.addAll(simpleEvents.stream().map(eventMapper::mapToView).toList());
        allEvents.addAll(referendums.stream().map(eventMapper::mapReferendumToView).toList());

        // Сортиране по дата
        allEvents.sort(Comparator.comparing(EventView::getCreatedAt,
                        Comparator.nullsLast(Comparator.naturalOrder())).reversed());

        // Ръчна пагинация
        int start = page * size;
        int end = Math.min(start + size, allEvents.size());
        List<EventView> paginated = allEvents.subList(start, end);

        return new PageImpl<>(paginated, PageRequest.of(page, size), allEvents.size());
    }




    @Override
    @Transactional()
    public List<EventView> getAllEvents() {
        List<SimpleEventEntity> events = simpleEventRepository.findAll();


        return events.stream()
                .sorted(Comparator.comparing(SimpleEventEntity::getCreatedAt).reversed()) // Сортиране по дата
                .map(eventMapper::mapToView) //  метода от EventMapper
                .collect(Collectors.toList());
    }



    @Override
    public EventView getEventById(Long id) {

        SimpleEventEntity event = simpleEventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Събитието не е намерено"));
        return eventMapper.mapToView(event);
    }

    @Transactional
    @Override
    public List<String> createEvent(CreateEventView dto,
                                    MultipartFile[] files,
                                    String positiveLabel,
                                    String negativeLabel,
                                    String neutralLabel) {
        SimpleEventEntity simpleEventEntity = new SimpleEventEntity();
        UserEntity user = userService.getCurrentUser();

        simpleEventEntity.setTitle(dto.getTitle());
        simpleEventEntity.setDescription(dto.getDescription());
        simpleEventEntity.setCreatorName(user.getUsername());
        simpleEventEntity.setCreatorImage(user.getImageUrl());
        simpleEventEntity.setCreatedAt(Instant.now());
        simpleEventEntity.setLocation(dto.getLocation());
        simpleEventEntity.setPositiveLabel(positiveLabel);
        simpleEventEntity.setNegativeLabel(negativeLabel);
        simpleEventEntity.setNeutralLabel(neutralLabel);
        user.setUserEventsCount(user.getUserEventsCount() + 1);

        List<String> imagePaths = new ArrayList<>();

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
                    imagePaths.add(imagePath);

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
            defaultImage.setImageUrl("/images/eventImages/defaultEvent.png");
            defaultImage.setEvent(simpleEventEntity);
            simpleEventEntity.getImages().add(defaultImage);
        }

        // Записване на събитието заедно с изображенията
        simpleEventRepository.saveAndFlush(simpleEventEntity);
        userRepository.save(user);

        return imagePaths;
    }


    @Transactional(readOnly = true)
    @Override
    public List<EventView> getUserEvents(String email) {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Потребителят не е намерен: " + email));

        List<SimpleEventEntity> events = simpleEventRepository.findAllByCreatorName(user.getUsername());

        return events.stream()
                .map(eventMapper::mapToView)
                .collect(Collectors.toList());
    }


    @Override
    public void deleteEvent(Long id) {
        simpleEventRepository.deleteById(id);
    }

}
