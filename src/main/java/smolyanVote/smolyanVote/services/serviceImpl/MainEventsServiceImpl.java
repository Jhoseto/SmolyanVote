package smolyanVote.smolyanVote.services.serviceImpl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.MultiPollEntity;
import smolyanVote.smolyanVote.models.ReferendumEntity;
import smolyanVote.smolyanVote.models.SimpleEventEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.repositories.MultiPollRepository;
import smolyanVote.smolyanVote.repositories.ReferendumRepository;
import smolyanVote.smolyanVote.repositories.SimpleEventRepository;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.interfaces.MainEventsService;
import smolyanVote.smolyanVote.services.mappers.AllEventsSimplePreviewMapper;
import smolyanVote.smolyanVote.viewsAndDTO.EventSimpleViewDTO;

import java.util.ArrayList;
import java.util.List;

@Service
public class MainEventsServiceImpl implements MainEventsService {
    private static final int MIN_PAGE = 0;
    private static final int MIN_SIZE = 1;

    private final SimpleEventRepository simpleEventRepository;
    private final ReferendumRepository referendumRepository;
    private final MultiPollRepository multiPollRepository;
    private final AllEventsSimplePreviewMapper allEventsSimplePreviewMapper;
    private final UserRepository userRepository;

    public MainEventsServiceImpl(SimpleEventRepository simpleEventRepository,
                                 ReferendumRepository referendumRepository,
                                 MultiPollRepository multiPollRepository,
                                 AllEventsSimplePreviewMapper allEventsSimplePreviewMapper,
                                 UserRepository userRepository) {
        this.simpleEventRepository = simpleEventRepository;
        this.referendumRepository = referendumRepository;
        this.multiPollRepository = multiPollRepository;
        this.allEventsSimplePreviewMapper = allEventsSimplePreviewMapper;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    @Override
    public Page<EventSimpleViewDTO> getPaginatedAllEvents(int page, int size) {
        // Валидация на параметрите
        page = Math.max(MIN_PAGE, page);
        size = Math.max(MIN_SIZE, size);

        // Извличане на всички данни (без пагинация)
        List<SimpleEventEntity> simpleEvents = simpleEventRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        List<ReferendumEntity> referendums = referendumRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        List<MultiPollEntity> multiPolls = multiPollRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));

        // Мапване към DTO
        List<EventSimpleViewDTO> allEvents = new ArrayList<>();
        allEvents.addAll(simpleEvents.stream()
                .map(allEventsSimplePreviewMapper::mapSimpleEventToSimpleView)
                .toList());
        allEvents.addAll(referendums.stream()
                .map(allEventsSimplePreviewMapper::mapReferendumToSimpleView)
                .toList());
        allEvents.addAll(multiPolls.stream()
                .map(allEventsSimplePreviewMapper::mapMultiPollToSimpleView)
                .toList());

        // Сортиране на комбинирания списък
        allEvents.sort((e1, e2) -> {
            if (e1.getCreatedAt() == null && e2.getCreatedAt() == null) return 0;
            if (e1.getCreatedAt() == null) return 1;
            if (e2.getCreatedAt() == null) return -1;
            return e2.getCreatedAt().compareTo(e1.getCreatedAt());
        });

        // Ръчна пагинация
        int start = page * size;
        int end = Math.min(start + size, allEvents.size());
        List<EventSimpleViewDTO> paginatedEvents = start < allEvents.size() ? allEvents.subList(start, end) : new ArrayList<>();

        // Връщане на пагиниран резултат
        return new PageImpl<>(paginatedEvents, PageRequest.of(page, size), allEvents.size());
    }

    @Transactional(readOnly = true)
    @Override
    public Page<EventSimpleViewDTO> getPaginatedSimpleEvents(int page, int size) {
        return getPaginatedEvents(page, size, simpleEventRepository,
                allEventsSimplePreviewMapper::mapSimpleEventToSimpleView);
    }

    @Transactional(readOnly = true)
    @Override
    public Page<EventSimpleViewDTO> getPaginatedReferendumEvents(int page, int size) {
        return getPaginatedEvents(page, size, referendumRepository,
                allEventsSimplePreviewMapper::mapReferendumToSimpleView);
    }

    @Transactional(readOnly = true)
    @Override
    public Page<EventSimpleViewDTO> getPaginatedMultiPollEvents(int page, int size) {
        return getPaginatedEvents(page, size, multiPollRepository,
                allEventsSimplePreviewMapper::mapMultiPollToSimpleView);
    }

    private <T> Page<EventSimpleViewDTO> getPaginatedEvents(int page, int size,
                                                            org.springframework.data.jpa.repository.JpaRepository<T, ?> repository,
                                                            java.util.function.Function<T, EventSimpleViewDTO> mapper) {
        // Валидация на параметрите
        page = Math.max(MIN_PAGE, page);
        size = Math.max(MIN_SIZE, size);

        // Настройка за сортиране по createdAt (низходящо)
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        // Извличане на пагинирани данни
        Page<T> entities = repository.findAll(pageable);

        // Мапване към DTO
        List<EventSimpleViewDTO> dtos = entities.getContent().stream()
                .map(mapper)
                .toList();

        return new PageImpl<>(dtos, pageable, entities.getTotalElements());
    }



    @Transactional(readOnly = true)
    @Override
    public List<EventSimpleViewDTO> getAllUserEvents(String email) {
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Потребителят не е намерен: " + email));

        List<SimpleEventEntity> simpleEvents = simpleEventRepository.findAllByCreatorName(user.getUsername());
        List<ReferendumEntity> referendums = referendumRepository.findAllByCreatorName(user.getUsername());
        List<MultiPollEntity> multiPoll = multiPollRepository.findAllByCreatorName(user.getUsername());

        List<EventSimpleViewDTO> allUserEvents = new ArrayList<>();
        allUserEvents.addAll(simpleEvents.stream().map(allEventsSimplePreviewMapper::mapSimpleEventToSimpleView).toList());
        allUserEvents.addAll(referendums.stream().map(allEventsSimplePreviewMapper::mapReferendumToSimpleView).toList());
        allUserEvents.addAll(multiPoll.stream().map(allEventsSimplePreviewMapper::mapMultiPollToSimpleView).toList());

        return allUserEvents;
    }
}