package smolyanVote.smolyanVote.services.serviceImpl;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.data.domain.*;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import smolyanVote.smolyanVote.models.*;
import smolyanVote.smolyanVote.models.enums.EventType;
import smolyanVote.smolyanVote.repositories.MultiPollRepository;
import smolyanVote.smolyanVote.repositories.SimpleEventRepository;
import smolyanVote.smolyanVote.repositories.ReferendumRepository;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.interfaces.CommentsService;
import smolyanVote.smolyanVote.services.interfaces.SimpleEventService;
import smolyanVote.smolyanVote.services.interfaces.VoteService;
import smolyanVote.smolyanVote.services.mappers.AllEventsSimplePreviewMapper;
import smolyanVote.smolyanVote.services.mappers.MultiPollMapper;
import smolyanVote.smolyanVote.services.mappers.ReferendumMapper;
import smolyanVote.smolyanVote.services.mappers.SimpleEventMapper;
import smolyanVote.smolyanVote.services.interfaces.UserService;
import smolyanVote.smolyanVote.viewsAndDTO.CreateEventView;
import smolyanVote.smolyanVote.viewsAndDTO.EventSimpleViewDTO;
import smolyanVote.smolyanVote.viewsAndDTO.SimpleEventDetailViewDTO;
import smolyanVote.smolyanVote.viewsAndDTO.commentsDTO.ReactionCountDto;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SimpleEventServiceImpl implements SimpleEventService {

    private final SimpleEventRepository simpleEventRepository;
    private final UserRepository userRepository;
    private final SimpleEventMapper simpleEventMapper;
    private final UserService userService;
    private final ImageCloudinaryServiceImpl imageStorageService;
    private final ReferendumRepository referendumRepository;
    private final AllEventsSimplePreviewMapper allEventsSimplePreviewMapper;
    private final MultiPollRepository multiPollRepository;
    private final VoteService voteService;
    private final CommentsService commentsService;


    @Autowired
    public SimpleEventServiceImpl(
            SimpleEventRepository simpleEventRepository, UserRepository userRepository,
            SimpleEventMapper simpleEventMapper,
            UserService userService,
            ImageCloudinaryServiceImpl imageStorageService,
            ReferendumRepository referendumRepository,
            AllEventsSimplePreviewMapper allEventsSimplePreviewMapper,
            MultiPollRepository multiPollRepository,
            VoteService voteService,
            CommentsService commentsService) {
        this.simpleEventRepository = simpleEventRepository;
        this.userRepository = userRepository;
        this.simpleEventMapper = simpleEventMapper;
        this.userService = userService;
        this.imageStorageService = imageStorageService;
        this.referendumRepository = referendumRepository;
        this.allEventsSimplePreviewMapper = allEventsSimplePreviewMapper;
        this.multiPollRepository = multiPollRepository;
        this.voteService = voteService;
        this.commentsService = commentsService;
    }


    @Transactional(readOnly = true)
    @Override
    public Page<EventSimpleViewDTO> getPaginatedEvents(int page, int size) {
        // Взимане на всички SimpleEventEntity и ReferendumEntity
        List<SimpleEventEntity> simpleEvents = simpleEventRepository.findAll();
        List<ReferendumEntity> referendums = referendumRepository.findAll();
        List<MultiPollEntity> multiPoll = multiPollRepository.findAll();

        // Мапваме към общия EventView (или създай подходящ метод)
        List<EventSimpleViewDTO> allEvents = new ArrayList<>();
        allEvents.addAll(simpleEvents.stream().map(allEventsSimplePreviewMapper::mapSimpleEventToSimpleView).toList());
        allEvents.addAll(referendums.stream().map(allEventsSimplePreviewMapper::mapReferendumToSimpleView).toList());
        allEvents.addAll(multiPoll.stream().map(allEventsSimplePreviewMapper::mapMultiPollToSimpleView).toList());

        // Сортиране по дата
        allEvents.sort(Comparator.comparing(EventSimpleViewDTO::getCreatedAt,
                        Comparator.nullsLast(Comparator.naturalOrder())).reversed());

        // Ръчна пагинация
        int start = page * size;
        int end = Math.min(start + size, allEvents.size());
        List<EventSimpleViewDTO> paginated = allEvents.subList(start, end);

        return new PageImpl<>(paginated, PageRequest.of(page, size), allEvents.size());
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
        // Глас
        VoteSimpleEventEntity vote = voteService.findByUserIdAndEventId(currentUser.getId(), id);
        String voteValue = (vote != null) ? vote.getVoteValue() : null;
        dto.setCurrentUserVote(voteValue);

        return dto;
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
    public List<EventSimpleViewDTO> getAllUserEvents(String email) {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Потребителят не е намерен: " + email));

        List<SimpleEventEntity> simpleEvents = simpleEventRepository.findAllByCreatorName(user.getUsername());
        List<ReferendumEntity> referendums = referendumRepository.findAllByCreatorName(user.getUsername());
        List<MultiPollEntity> multiPoll = multiPollRepository.findAllByCreatorName(user.getUsername());

        List<EventSimpleViewDTO> allEvents = new ArrayList<>();
        allEvents.addAll(simpleEvents.stream().map(allEventsSimplePreviewMapper::mapSimpleEventToSimpleView).toList());
        allEvents.addAll(referendums.stream().map(allEventsSimplePreviewMapper::mapReferendumToSimpleView).toList());
        allEvents.addAll(multiPoll.stream().map(allEventsSimplePreviewMapper::mapMultiPollToSimpleView).toList());

        return allEvents;
    }

}
