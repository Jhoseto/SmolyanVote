package smolyanVote.smolyanVote.services.serviceImpl;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.models.SimpleEventEntity;
import smolyanVote.smolyanVote.models.SimpleEventImageEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.repositories.EventRepository;
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

    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final EventMapper eventMapper;
    private final UserService userService;
    private final ImageStorageServiceImpl imageStorageService;

    @Autowired
    public EventServiceImpl(EventRepository eventRepository,
                            UserRepository userRepository,
                            EventMapper eventMapper,
                            UserService userService,
                            ImageStorageServiceImpl imageStorageService) {
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
        this.eventMapper = eventMapper;
        this.userService = userService;
        this.imageStorageService = imageStorageService;
    }


    @Transactional(readOnly = true)
    @Override
    public Page<EventView> getPaginatedEvents(int page, int size) {
        // Pageable обект
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt")));

        //  пагинирани събития от репозитория
        Page<SimpleEventEntity> eventPage = eventRepository.findAll(pageable);

        return eventPage.map(eventMapper::mapToView);
    }



    @Override
    @Transactional(readOnly = true)
    public List<EventView> getAllEvents() {
        List<SimpleEventEntity> events = eventRepository.findAll();

        return events.stream()
                .sorted(Comparator.comparing(SimpleEventEntity::getCreatedAt).reversed()) // Сортиране по дата
                .map(eventMapper::mapToView) //  метода от EventMapper
                .collect(Collectors.toList());
    }

    @Override
    public EventView getEventById(Long id) {

        SimpleEventEntity event = eventRepository.findById(id)
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
                    String imagePath = imageStorageService.saveSingleImage(file, 0L);
                    imagePaths.add(imagePath);

                    SimpleEventImageEntity imageEntity = new SimpleEventImageEntity();
                    imageEntity.setImageUrl(imagePath);
                    imageEntity.setEvent(simpleEventEntity);
                    simpleEventEntity.getImages().add(imageEntity);  // Добавяне директно към списъка
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
        eventRepository.saveAndFlush(simpleEventEntity);
        userRepository.save(user);

        return imagePaths;
    }





    @Transactional(readOnly = true)
    @Override
    public List<EventView> getUserEvents(String email) {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Потребителят не е намерен: " + email));

        List<SimpleEventEntity> events = eventRepository.findAllByCreatorName(user.getUsername());

        return events.stream()
                .map(eventMapper::mapToView)
                .collect(Collectors.toList());
    }





    @Override
    public void deleteEvent(Long id) {
        eventRepository.deleteById(id);
    }

}
