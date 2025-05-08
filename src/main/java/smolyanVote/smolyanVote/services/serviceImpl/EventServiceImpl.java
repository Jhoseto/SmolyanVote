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
import smolyanVote.smolyanVote.models.EventEntity;
import smolyanVote.smolyanVote.models.EventImageEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.repository.EventRepository;
import smolyanVote.smolyanVote.repository.UserRepository;
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
        Page<EventEntity> eventPage = eventRepository.findAll(pageable);

        return eventPage.map(eventMapper::mapToView);
    }



    @Override
    @Transactional(readOnly = true)
    public List<EventView> getAllEvents() {
        List<EventEntity> events = eventRepository.findAll();

        return events.stream()
                .sorted(Comparator.comparing(EventEntity::getCreatedAt).reversed()) // Сортиране по дата
                .map(eventMapper::mapToView) //  метода от EventMapper
                .collect(Collectors.toList());
    }

    @Override
    public EventView getEventById(Long id) {

        EventEntity event = eventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Събитието не е намерено"));
        return eventMapper.mapToView(event);
    }

    @Transactional(readOnly = true)
    @Override
    public List<String> createEvent(CreateEventView dto, MultipartFile[] files) {
        EventEntity eventEntity = new EventEntity();
        UserEntity user = userService.getCurrentUser();

        eventEntity.setTitle(dto.getTitle());
        eventEntity.setDescription(dto.getDescription());
        eventEntity.setCreatorName(userService.getCurrentUser().getUsername());
        eventEntity.setCreatorImage(userService.getCurrentUser().getImageUrl());
        eventEntity.setCreatedAt(Instant.now());
        eventEntity.setLocation(dto.getLocation());
        user.setUserEventsCount(user.getUserEventsCount()+1);

        // Записваме събитието и получаваме ID
        eventRepository.saveAndFlush(eventEntity);
        userRepository.save(user);
        long eventId = eventEntity.getId();

        List<EventImageEntity> imageEntities = new ArrayList<>();
        List<String> imagePaths = new ArrayList<>();

        // Записване на изображенията
        if (files != null && files.length > 0) {
            // Обработваме всеки файл
            for (MultipartFile file : files) {
                if (file != null && !file.isEmpty()) {
                    String imagePath = imageStorageService.saveSingleImage(file, eventId);
                    imagePaths.add(imagePath);

                    // Създаване на EventImageEntity за всяко изображение
                    EventImageEntity imageEntity = new EventImageEntity();
                    imageEntity.setImageUrl(imagePath);
                    imageEntity.setEvent(eventEntity);
                    imageEntities.add(imageEntity);
                }
            }
        }

        // Ако няма качени изображения, добавяме default
        if (imageEntities.isEmpty()) {
            EventImageEntity defaultImage = new EventImageEntity();
            defaultImage.setImageUrl("/images/eventImages/defaultEvent.png");
            defaultImage.setEvent(eventEntity);
            imageEntities.add(defaultImage);
        }

        eventEntity.setImages(imageEntities);
        eventRepository.save(eventEntity);  // Обновяваме събитието със снимките

        return imagePaths;
    }




    @Transactional(readOnly = true)
    @Override
    public List<EventView> getUserEvents(String email) {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Потребителят не е намерен: " + email));

        List<EventEntity> events = eventRepository.findAllByCreatorName(user.getUsername());

        return events.stream()
                .map(eventMapper::mapToView)
                .collect(Collectors.toList());
    }





    @Override
    public void deleteEvent(Long id) {
        eventRepository.deleteById(id);
    }

}
