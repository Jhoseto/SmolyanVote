package smolyanVote.smolyanVote.services.serviceImpl;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import smolyanVote.smolyanVote.models.MultiPollEntity;
import smolyanVote.smolyanVote.models.ReferendumEntity;
import smolyanVote.smolyanVote.models.SimpleEventEntity;
import smolyanVote.smolyanVote.models.enums.EventStatus;
import smolyanVote.smolyanVote.models.enums.EventType;
import smolyanVote.smolyanVote.models.enums.Locations;
import smolyanVote.smolyanVote.repositories.MultiPollRepository;
import smolyanVote.smolyanVote.repositories.ReferendumRepository;
import smolyanVote.smolyanVote.repositories.SimpleEventRepository;
import smolyanVote.smolyanVote.repositories.UserFollowRepository;
import smolyanVote.smolyanVote.repositories.VoteMultiPollRepository;
import smolyanVote.smolyanVote.repositories.VoteReferendumRepository;
import smolyanVote.smolyanVote.repositories.VoteSimpleEventRepository;
import smolyanVote.smolyanVote.services.interfaces.MainEventsService;
import smolyanVote.smolyanVote.services.mappers.AllEventsSimplePreviewMapper;
import smolyanVote.smolyanVote.viewsAndDTO.EventSimpleViewDTO;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

@Service
public class MainEventsServiceImpl implements MainEventsService {

    private final AllEventsSimplePreviewMapper allEventsSimplePreviewMapper;
    private final ExecutorService executorService;
    private final UserFollowRepository userFollowRepository;
    private final VoteSimpleEventRepository voteSimpleEventRepository;
    private final VoteReferendumRepository voteReferendumRepository;
    private final VoteMultiPollRepository voteMultiPollRepository;
    private final SimpleEventRepository simpleEventRepository;
    private final ReferendumRepository referendumRepository;
    private final MultiPollRepository multiPollRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public MainEventsServiceImpl(
            AllEventsSimplePreviewMapper allEventsSimplePreviewMapper,
            UserFollowRepository userFollowRepository,
            VoteSimpleEventRepository voteSimpleEventRepository,
            VoteReferendumRepository voteReferendumRepository,
            VoteMultiPollRepository voteMultiPollRepository,
            SimpleEventRepository simpleEventRepository,
            ReferendumRepository referendumRepository,
            MultiPollRepository multiPollRepository) {

        this.allEventsSimplePreviewMapper = allEventsSimplePreviewMapper;
        this.userFollowRepository = userFollowRepository;
        this.voteSimpleEventRepository = voteSimpleEventRepository;
        this.voteReferendumRepository = voteReferendumRepository;
        this.voteMultiPollRepository = voteMultiPollRepository;
        this.simpleEventRepository = simpleEventRepository;
        this.referendumRepository = referendumRepository;
        this.multiPollRepository = multiPollRepository;
        this.executorService = Executors.newFixedThreadPool(3); // За паралелни заявки
    }

    @Transactional(readOnly = true)
    @Override
    public Page<EventSimpleViewDTO> findAllEvents(String search, String location, EventType type, EventStatus status, Pageable pageable) {
        // Backward compatibility - извикваме новия метод с null стойности за новите филтри
        return findAllEvents(search, location, type, status, null, null, null, null, null, null, pageable);
    }

    @Transactional(readOnly = true)
    @Override
    public Page<EventSimpleViewDTO> findAllEvents(String search, String location, EventType type, EventStatus status, 
                                                  Instant dateFrom, Instant dateTo, Integer minVotes, Integer maxVotes, 
                                                  String creatorUsername, String popularityFilter, Pageable pageable) {
        // Backward compatibility - извикваме новия метод с null стойности за quickFilter
        return findAllEvents(search, location, type, status, dateFrom, dateTo, minVotes, maxVotes, 
                             creatorUsername, popularityFilter, null, null, pageable);
    }

    @Transactional(readOnly = true)
    @Override
    public Page<EventSimpleViewDTO> findAllEvents(String search, String location, EventType type, EventStatus status, 
                                                  Instant dateFrom, Instant dateTo, Integer minVotes, Integer maxVotes, 
                                                  String creatorUsername, String popularityFilter, 
                                                  String quickFilter, Long currentUserId, Pageable pageable) {
        long startTime = System.currentTimeMillis();

        try {
            // Парсваме филтрите
            SearchParameters params = parseSearchParameters(search, location, type, status, dateFrom, dateTo, 
                                                          minVotes, maxVotes, creatorUsername, popularityFilter);

            // Ако имаме специфичен тип, използваме оптимизирана заявка
            Page<EventSimpleViewDTO> result;
            if (type != null) {
                result = findEventsBySpecificType(params, pageable, type);
            } else {
                // В противен случай търсим във всички типове паралелно
                result = findEventsFromAllTypes(params, pageable);
            }

            // Прилагаме quickFilter ако е зададен
            if (quickFilter != null && currentUserId != null && result != null && !result.getContent().isEmpty()) {
                try {
                    result = applyQuickFilter(result, quickFilter, currentUserId, pageable);
                } catch (Exception e) {
                    // Ако има грешка при прилагането на quickFilter, продължаваме с оригиналния резултат
                    // Логваме грешката за debugging
                    System.err.println("Error applying quickFilter: " + e.getMessage());
                    e.printStackTrace();
                }
            }

            return result;

        } catch (Exception e) {
            throw new RuntimeException("Failed to retrieve events", e);
        }
    }

    @Transactional(readOnly = true)
    @Override
    public List<EventSimpleViewDTO> getAllUserEvents(String username) {
        if (!StringUtils.hasText(username)) {
            return new ArrayList<>();
        }

        try {
            // Синхронен подход - по-прост и надежден за @Transactional методи

            // Извличане на SimpleEvents
            List<SimpleEventEntity> simpleEvents = getSimpleEventsByCreatorUsername(username);
            List<EventSimpleViewDTO> userEvents = new ArrayList<>(simpleEvents.stream()
                    .map(allEventsSimplePreviewMapper::mapSimpleEventToSimpleView)
                    .toList());

            // Извличане на Referendums
            List<ReferendumEntity> referendums = getReferendumsByCreatorUsername(username);
            userEvents.addAll(referendums.stream()
                    .map(allEventsSimplePreviewMapper::mapReferendumToSimpleView)
                    .toList());

            // Извличане на MultiPolls
            List<MultiPollEntity> multiPolls = getMultiPollsByCreatorUsername(username);
            userEvents.addAll(multiPolls.stream()
                    .map(allEventsSimplePreviewMapper::mapMultiPollToSimpleView)
                    .toList());

            // Сортираме по дата на създаване (най-новите първо)
            userEvents.sort((e1, e2) -> e2.getCreatedAt().compareTo(e1.getCreatedAt()));

            return userEvents;

        } catch (Exception e) {
            return new ArrayList<>();
        }
    }


    /**
     * Намира събития от специфичен тип с оптимизирана заявка
     */
    private Page<EventSimpleViewDTO> findEventsBySpecificType(SearchParameters params, Pageable pageable, EventType type) {
        return switch (type) {
            case SIMPLEEVENT -> findSimpleEventsOptimized(params, pageable);
            case REFERENDUM -> findReferendumsOptimized(params, pageable);
            case MULTI_POLL -> findMultiPollsOptimized(params, pageable);
            default -> new PageImpl<>(new ArrayList<>(), pageable, 0);
        };
    }

    /**
     * Намира събития от всички типове и ги комбинира
     */
    private Page<EventSimpleViewDTO> findEventsFromAllTypes(SearchParameters params, Pageable pageable) {
        // Паралелно извличане на данни от всички таблици
        CompletableFuture<List<EventSimpleViewDTO>> simpleEventsFuture = CompletableFuture
                .supplyAsync(() -> getFilteredSimpleEventsAsDTOs(params), executorService);

        CompletableFuture<List<EventSimpleViewDTO>> referendumsFuture = CompletableFuture
                .supplyAsync(() -> getFilteredReferendumsAsDTOs(params), executorService);

        CompletableFuture<List<EventSimpleViewDTO>> multiPollsFuture = CompletableFuture
                .supplyAsync(() -> getFilteredMultiPollsAsDTOs(params), executorService);

        // Събираме всички резултати
        List<EventSimpleViewDTO> allEvents = new ArrayList<>();

        try {
            CompletableFuture.allOf(simpleEventsFuture, referendumsFuture, multiPollsFuture).join();

            allEvents.addAll(simpleEventsFuture.get());
            allEvents.addAll(referendumsFuture.get());
            allEvents.addAll(multiPollsFuture.get());

        } catch (Exception e) {
            throw new RuntimeException("Failed to retrieve events", e);
        }

        // Сортираме по зададената сортировка (която вече може да включва popularity)
        sortEventsList(allEvents, pageable.getSort());
        
        return applyPagination(allEvents, pageable);
    }

    /**
     * Оптимизирана заявка за SimpleEvents с pagination в базата данни
     */
    private Page<EventSimpleViewDTO> findSimpleEventsOptimized(SearchParameters params, Pageable pageable) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();

        // Count query
        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<SimpleEventEntity> countRoot = countQuery.from(SimpleEventEntity.class);
        countQuery.select(cb.count(countRoot));
        addPredicatesToQuery(countQuery, countRoot, cb, params);

        Long totalElements = entityManager.createQuery(countQuery).getSingleResult();

        if (totalElements == 0) {
            return new PageImpl<>(new ArrayList<>(), pageable, 0);
        }

        // Data query
        CriteriaQuery<SimpleEventEntity> dataQuery = cb.createQuery(SimpleEventEntity.class);
        Root<SimpleEventEntity> dataRoot = dataQuery.from(SimpleEventEntity.class);
        dataQuery.select(dataRoot);
        addPredicatesToQuery(dataQuery, dataRoot, cb, params);
        addSortingToQuery(dataQuery, dataRoot, cb, pageable.getSort());

        TypedQuery<SimpleEventEntity> typedQuery = entityManager.createQuery(dataQuery);
        typedQuery.setFirstResult((int) pageable.getOffset());
        typedQuery.setMaxResults(pageable.getPageSize());

        List<SimpleEventEntity> entities = typedQuery.getResultList();
        List<EventSimpleViewDTO> dtos = entities.stream()
                .map(allEventsSimplePreviewMapper::mapSimpleEventToSimpleView)
                .toList();

        return new PageImpl<>(dtos, pageable, totalElements);
    }

    /**
     * Аналогично за Referendums
     */
    private Page<EventSimpleViewDTO> findReferendumsOptimized(SearchParameters params, Pageable pageable) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();

        // Count query
        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<ReferendumEntity> countRoot = countQuery.from(ReferendumEntity.class);
        countQuery.select(cb.count(countRoot));
        addPredicatesToQuery(countQuery, countRoot, cb, params);

        Long totalElements = entityManager.createQuery(countQuery).getSingleResult();

        if (totalElements == 0) {
            return new PageImpl<>(new ArrayList<>(), pageable, 0);
        }

        // Data query
        CriteriaQuery<ReferendumEntity> dataQuery = cb.createQuery(ReferendumEntity.class);
        Root<ReferendumEntity> dataRoot = dataQuery.from(ReferendumEntity.class);
        dataQuery.select(dataRoot);
        addPredicatesToQuery(dataQuery, dataRoot, cb, params);
        addSortingToQuery(dataQuery, dataRoot, cb, pageable.getSort());

        TypedQuery<ReferendumEntity> typedQuery = entityManager.createQuery(dataQuery);
        typedQuery.setFirstResult((int) pageable.getOffset());
        typedQuery.setMaxResults(pageable.getPageSize());

        List<ReferendumEntity> entities = typedQuery.getResultList();
        List<EventSimpleViewDTO> dtos = entities.stream()
                .map(allEventsSimplePreviewMapper::mapReferendumToSimpleView)
                .toList();

        return new PageImpl<>(dtos, pageable, totalElements);
    }

    /**
     * Аналогично за MultiPolls
     */
    private Page<EventSimpleViewDTO> findMultiPollsOptimized(SearchParameters params, Pageable pageable) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();

        // Count query
        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<MultiPollEntity> countRoot = countQuery.from(MultiPollEntity.class);
        countQuery.select(cb.count(countRoot));
        addPredicatesToQuery(countQuery, countRoot, cb, params);

        Long totalElements = entityManager.createQuery(countQuery).getSingleResult();

        if (totalElements == 0) {
            return new PageImpl<>(new ArrayList<>(), pageable, 0);
        }

        // Data query
        CriteriaQuery<MultiPollEntity> dataQuery = cb.createQuery(MultiPollEntity.class);
        Root<MultiPollEntity> dataRoot = dataQuery.from(MultiPollEntity.class);
        dataQuery.select(dataRoot);
        addPredicatesToQuery(dataQuery, dataRoot, cb, params);
        addSortingToQuery(dataQuery, dataRoot, cb, pageable.getSort());

        TypedQuery<MultiPollEntity> typedQuery = entityManager.createQuery(dataQuery);
        typedQuery.setFirstResult((int) pageable.getOffset());
        typedQuery.setMaxResults(pageable.getPageSize());

        List<MultiPollEntity> entities = typedQuery.getResultList();
        List<EventSimpleViewDTO> dtos = entities.stream()
                .map(allEventsSimplePreviewMapper::mapMultiPollToSimpleView)
                .toList();

        return new PageImpl<>(dtos, pageable, totalElements);
    }

    /**
     * Помощни методи за извличане на филтрирани данни като DTO
     */
    private List<EventSimpleViewDTO> getFilteredSimpleEventsAsDTOs(SearchParameters params) {
        List<SimpleEventEntity> entities = getFilteredSimpleEvents(params);
        return entities.stream()
                .map(allEventsSimplePreviewMapper::mapSimpleEventToSimpleView)
                .toList();
    }

    private List<EventSimpleViewDTO> getFilteredReferendumsAsDTOs(SearchParameters params) {
        List<ReferendumEntity> entities = getFilteredReferendums(params);
        return entities.stream()
                .map(allEventsSimplePreviewMapper::mapReferendumToSimpleView)
                .toList();
    }

    private List<EventSimpleViewDTO> getFilteredMultiPollsAsDTOs(SearchParameters params) {
        List<MultiPollEntity> entities = getFilteredMultiPolls(params);
        return entities.stream()
                .map(allEventsSimplePreviewMapper::mapMultiPollToSimpleView)
                .toList();
    }

    /**
     * Методи за извличане на филтрирани entitites
     */
    private List<SimpleEventEntity> getFilteredSimpleEvents(SearchParameters params) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<SimpleEventEntity> query = cb.createQuery(SimpleEventEntity.class);
        Root<SimpleEventEntity> root = query.from(SimpleEventEntity.class);

        addPredicatesToQuery(query, root, cb, params);

        return entityManager.createQuery(query).getResultList();
    }

    private List<ReferendumEntity> getFilteredReferendums(SearchParameters params) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<ReferendumEntity> query = cb.createQuery(ReferendumEntity.class);
        Root<ReferendumEntity> root = query.from(ReferendumEntity.class);

        addPredicatesToQuery(query, root, cb, params);

        return entityManager.createQuery(query).getResultList();
    }

    private List<MultiPollEntity> getFilteredMultiPolls(SearchParameters params) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<MultiPollEntity> query = cb.createQuery(MultiPollEntity.class);
        Root<MultiPollEntity> root = query.from(MultiPollEntity.class);

        addPredicatesToQuery(query, root, cb, params);

        return entityManager.createQuery(query).getResultList();
    }

    /**
     * Универсален метод за добавяне на predicates към query
     */
    private <T> void addPredicatesToQuery(CriteriaQuery<T> query, Root<?> root, CriteriaBuilder cb, SearchParameters params) {
        List<Predicate> predicates = new ArrayList<>();

        // Търсене по заглавие или creatorName
        if (StringUtils.hasText(params.search())) {
            String searchPattern = "%" + params.search().toLowerCase() + "%";
            predicates.add(cb.or(
                    cb.like(cb.lower(root.get("title")), searchPattern),
                    cb.like(cb.lower(root.get("creatorName")), searchPattern)
            ));
        }

        // Филтър по локация
        if (params.location() != null) {
            predicates.add(cb.equal(root.get("location"), params.location()));
        }

        // Филтър по статус
        if (params.status() != null) {
            predicates.add(cb.equal(root.get("eventStatus"), params.status()));
        }

        // Филтър по дата - от
        if (params.dateFrom() != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), params.dateFrom()));
        }

        // Филтър по дата - до
        if (params.dateTo() != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), params.dateTo()));
        }

        // Филтър по минимален брой гласове
        if (params.minVotes() != null && params.minVotes() >= 0) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("totalVotes"), params.minVotes()));
        }

        // Филтър по максимален брой гласове
        if (params.maxVotes() != null && params.maxVotes() >= 0) {
            predicates.add(cb.lessThanOrEqualTo(root.get("totalVotes"), params.maxVotes()));
        }

        // Филтър по автор
        if (StringUtils.hasText(params.creatorUsername())) {
            predicates.add(cb.equal(cb.lower(root.get("creatorName")), params.creatorUsername().toLowerCase()));
        }

        if (!predicates.isEmpty()) {
            query.where(cb.and(predicates.toArray(new Predicate[0])));
        }
    }

    /**
     * Добавя сортиране към query
     */
    private <T> void addSortingToQuery(CriteriaQuery<T> query, Root<?> root, CriteriaBuilder cb, Sort sort) {
        if (sort == null || sort.isEmpty()) {
            query.orderBy(cb.desc(root.get("createdAt")));
            return;
        }

        List<Order> orders = new ArrayList<>();
        for (Sort.Order order : sort) {
            String property = order.getProperty();
            
            // Мапване на "popularity" към "totalVotes"
            if ("popularity".equals(property)) {
                property = "totalVotes";
            }

            // Проверка дали свойството съществува
            try {
                if (order.isAscending()) {
                    orders.add(cb.asc(root.get(property)));
                } else {
                    orders.add(cb.desc(root.get(property)));
                }
            } catch (IllegalArgumentException e) {
                // Ако свойството не съществува, пропускаме го
                continue;
            }
        }
        
        if (!orders.isEmpty()) {
            query.orderBy(orders);
        } else {
            // Ако няма валидни orders, използваме default сортировка
            query.orderBy(cb.desc(root.get("createdAt")));
        }
    }

    /**
     * Методи за извличане на събития по creator name (оптимизирани)
     */
    private List<SimpleEventEntity> getSimpleEventsByCreatorUsername(String username) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<SimpleEventEntity> query = cb.createQuery(SimpleEventEntity.class);
        Root<SimpleEventEntity> root = query.from(SimpleEventEntity.class);

        query.where(cb.equal(root.get("creatorName"), username));
        query.orderBy(cb.desc(root.get("createdAt")));

        return entityManager.createQuery(query).getResultList();
    }

    private List<ReferendumEntity> getReferendumsByCreatorUsername(String username) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<ReferendumEntity> query = cb.createQuery(ReferendumEntity.class);
        Root<ReferendumEntity> root = query.from(ReferendumEntity.class);

        query.where(cb.equal(root.get("creatorName"), username));
        query.orderBy(cb.desc(root.get("createdAt")));

        return entityManager.createQuery(query).getResultList();
    }

    private List<MultiPollEntity> getMultiPollsByCreatorUsername(String username) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<MultiPollEntity> query = cb.createQuery(MultiPollEntity.class);
        Root<MultiPollEntity> root = query.from(MultiPollEntity.class);

        query.where(cb.equal(root.get("creatorName"), username));
        query.orderBy(cb.desc(root.get("createdAt")));

        return entityManager.createQuery(query).getResultList();

    }

    /**
     * Парсва входните параметри в обект SearchParameters
     */
    private SearchParameters parseSearchParameters(String search, String location, EventType type, EventStatus status) {
        return parseSearchParameters(search, location, type, status, null, null, null, null, null, null);
    }

    /**
     * Парсва входните параметри в обект SearchParameters (разширена версия)
     */
    private SearchParameters parseSearchParameters(String search, String location, EventType type, EventStatus status,
                                                   Instant dateFrom, Instant dateTo, Integer minVotes, Integer maxVotes,
                                                   String creatorUsername, String popularityFilter) {
        String cleanSearch = StringUtils.hasText(search) ? search.trim() : null;

        Locations locationEnum = null;
        if (StringUtils.hasText(location)) {
            try {
                locationEnum = Locations.valueOf(location.toUpperCase());
            } catch (IllegalArgumentException ignored) {
            }
        }

        // status вече е EventStatus enum - само проверяваме дали не е null
        EventStatus statusEnum = status; // Директно присвояване

        // Почистване на creatorUsername
        String cleanCreatorUsername = StringUtils.hasText(creatorUsername) ? creatorUsername.trim() : null;

        // Почистване на popularityFilter
        String cleanPopularityFilter = StringUtils.hasText(popularityFilter) ? popularityFilter.trim() : null;

        return new SearchParameters(cleanSearch, locationEnum, statusEnum, dateFrom, dateTo, 
                                   minVotes, maxVotes, cleanCreatorUsername, cleanPopularityFilter);
    }

    /**
     * Сортира списък от события
     */
    private void sortEventsList(List<EventSimpleViewDTO> events, Sort sort) {
        if (events.isEmpty()) {
            return;
        }
        
        if (sort == null || sort.isEmpty()) {
            // По подразбиране сортираме по дата (най-новите първо)
            events.sort((e1, e2) -> {
                if (e1.getCreatedAt() == null && e2.getCreatedAt() == null) return 0;
                if (e1.getCreatedAt() == null) return 1;
                if (e2.getCreatedAt() == null) return -1;
                return e2.getCreatedAt().compareTo(e1.getCreatedAt());
            });
            return;
        }

        events.sort((e1, e2) -> {
            for (Sort.Order order : sort) {
                String property = order.getProperty();
                
                // Мапване на "popularity" към "totalVotes"
                if ("popularity".equals(property)) {
                    property = "totalVotes";
                }

                int comparison = compareEventsByProperty(e1, e2, property);
                if (comparison != 0) {
                    return order.isAscending() ? comparison : -comparison;
                }
            }
            // Ако всички свойства са равни, сортираме по дата като вторичен критерий
            if (e1.getCreatedAt() != null && e2.getCreatedAt() != null) {
                return e2.getCreatedAt().compareTo(e1.getCreatedAt());
            }
            return 0;
        });
    }

    /**
     * Сравнява два събития по определено свойство
     */
    private int compareEventsByProperty(EventSimpleViewDTO e1, EventSimpleViewDTO e2, String property) {
        return switch (property) {
            case "title" -> compareStrings(e1.getTitle(), e2.getTitle());
            case "totalVotes" -> Integer.compare(e1.getTotalVotes(), e2.getTotalVotes());
            case "createdAt" -> {
                if (e1.getCreatedAt() == null && e2.getCreatedAt() == null) yield 0;
                if (e1.getCreatedAt() == null) yield 1;
                if (e2.getCreatedAt() == null) yield -1;
                yield e1.getCreatedAt().compareTo(e2.getCreatedAt());
            }
            case "creatorName" -> compareStrings(e1.getCreatorName(), e2.getCreatorName());
            case "location" -> compareEnums(e1.getLocation(), e2.getLocation());
            case "status" -> compareEnums(e1.getEventStatus(), e2.getEventStatus());
            case "viewCounter" -> Integer.compare(e1.getViewCounter(), e2.getViewCounter());
            case "eventType" -> compareEnums(e1.getEventType(), e2.getEventType());
            default -> 0;
        };
    }

    /**
     * Помощни методи за сравнение
     */
    private int compareStrings(String s1, String s2) {
        if (s1 == null && s2 == null) return 0;
        if (s1 == null) return -1;
        if (s2 == null) return 1;
        return s1.compareToIgnoreCase(s2);
    }

    private int compareIntegers(Integer i1, Integer i2) {
        if (i1 == null && i2 == null) return 0;
        if (i1 == null) return -1;
        if (i2 == null) return 1;
        return Integer.compare(i1, i2);
    }

    private int compareEnums(Enum<?> e1, Enum<?> e2) {
        if (e1 == null && e2 == null) return 0;
        if (e1 == null) return -1;
        if (e2 == null) return 1;
        return e1.toString().compareToIgnoreCase(e2.toString());
    }


    /**
     * Прилага quickFilter върху резултатите
     */
    private Page<EventSimpleViewDTO> applyQuickFilter(Page<EventSimpleViewDTO> page, String quickFilter, Long currentUserId, Pageable pageable) {
        if (page == null || page.getContent() == null || quickFilter == null || currentUserId == null) {
            return page;
        }
        
        List<EventSimpleViewDTO> filtered = new ArrayList<>(page.getContent());

        try {
            switch (quickFilter) {
                case "following":
                    // Филтрираме само събития от следвани автори
                    List<String> followingUsernames = findFollowingUsernames(currentUserId);
                    if (!followingUsernames.isEmpty()) {
                        filtered = filtered.stream()
                            .filter(event -> {
                                if (event == null) return false;
                                String creatorName = event.getCreatorName();
                                return creatorName != null && followingUsernames.stream()
                                    .anyMatch(username -> username != null && username.equalsIgnoreCase(creatorName));
                            })
                            .toList();
                    } else {
                        // Ако не следва никого, връщаме празен списък
                        filtered = new ArrayList<>();
                    }
                    break;
                case "not-voted":
                    // Филтрираме само събития на които потребителят НЕ е гласувал
                    filtered = filtered.stream()
                        .filter(event -> {
                            if (event == null || event.getId() == null || event.getEventType() == null) {
                                return false;
                            }
                            try {
                                return !hasUserVoted(currentUserId, event.getId(), event.getEventType());
                            } catch (Exception e) {
                                // Ако има грешка при проверката, пропускаме събитието
                                return false;
                            }
                        })
                        .toList();
                    break;
                case "voted":
                    // Филтрираме само събития на които потребителят Е гласувал
                    filtered = filtered.stream()
                        .filter(event -> {
                            if (event == null || event.getId() == null || event.getEventType() == null) {
                                return false;
                            }
                            try {
                                return hasUserVoted(currentUserId, event.getId(), event.getEventType());
                            } catch (Exception e) {
                                // Ако има грешка при проверката, пропускаме събитието
                                return false;
                            }
                        })
                        .toList();
                    break;
                case "new-events":
                    // Този филтър вече е приложен чрез datePeriod в контролера
                    // Не правим допълнителна филтрация тук
                    break;
                default:
                    // Непознат quickFilter - не правим нищо
                    break;
            }
        } catch (Exception e) {
            // Ако има грешка при прилагането на quickFilter, връщаме оригиналния резултат
            return page;
        }

        // Прилагаме пагинация върху филтрираните резултати
        return applyPagination(filtered, pageable);
    }

    /**
     * Проверява дали потребителят е гласувал на събитие
     */
    private boolean hasUserVoted(Long userId, Long eventId, EventType eventType) {
        if (userId == null || eventId == null || eventType == null) {
            return false;
        }
        
        try {
            if (eventType == EventType.SIMPLEEVENT) {
                return voteSimpleEventRepository.findByUserIdAndEventId(userId, eventId).isPresent();
            } else if (eventType == EventType.REFERENDUM) {
                return voteReferendumRepository.findByReferendum_IdAndUser_Id(eventId, userId).isPresent();
            } else if (eventType == EventType.MULTI_POLL) {
                return voteMultiPollRepository.existsByMultiPollIdAndUserId(eventId, userId);
            }
        } catch (Exception e) {
            // Ако има грешка при проверката, връщаме false
            System.err.println("Error checking if user voted: " + e.getMessage());
            return false;
        }
        
        return false;
    }

    /**
     * Прилага пагинация в паметта (използва се когато комбинираме резултати)
     */
    private Page<EventSimpleViewDTO> applyPagination(List<EventSimpleViewDTO> events, Pageable pageable) {
        int total = events.size();
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), total);

        if (start >= total) {
            return new PageImpl<>(new ArrayList<>(), pageable, total);
        }

        List<EventSimpleViewDTO> pageContent = events.subList(start, end);
        return new PageImpl<>(pageContent, pageable, total);
    }

    /**
     * Cleanup метод за ExecutorService
     */
    public void destroy() {
        if (executorService != null && !executorService.isShutdown()) {
            executorService.shutdown();
        }
    }

    /**
     * Връща статистики за събитията
     */
    @Transactional(readOnly = true)
    @Override
    public Map<String, Object> getEventsStatistics() {
        Map<String, Object> stats = new HashMap<>();
        
        // Общ брой събития по тип
        long totalSimpleEvents = simpleEventRepository.count();
        long totalReferendums = referendumRepository.count();
        long totalMultiPolls = multiPollRepository.count();
        long totalEvents = totalSimpleEvents + totalReferendums + totalMultiPolls;
        
        stats.put("totalEvents", totalEvents);
        stats.put("totalSimpleEvents", totalSimpleEvents);
        stats.put("totalReferendums", totalReferendums);
        stats.put("totalMultiPolls", totalMultiPolls);
        
        // Активни събития - използваме Criteria API
        long activeSimpleEvents = countByStatus(SimpleEventEntity.class, EventStatus.ACTIVE);
        long activeReferendums = countByStatus(ReferendumEntity.class, EventStatus.ACTIVE);
        long activeMultiPolls = countByStatus(MultiPollEntity.class, EventStatus.ACTIVE);
        long totalActive = activeSimpleEvents + activeReferendums + activeMultiPolls;
        
        stats.put("totalActive", totalActive);
        stats.put("activeSimpleEvents", activeSimpleEvents);
        stats.put("activeReferendums", activeReferendums);
        stats.put("activeMultiPolls", activeMultiPolls);
        
        // Събития за последните 7 дни
        Instant weekAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        long recentSimpleEvents = countByCreatedAtAfter(SimpleEventEntity.class, weekAgo);
        long recentReferendums = countByCreatedAtAfter(ReferendumEntity.class, weekAgo);
        long recentMultiPolls = countByCreatedAtAfter(MultiPollEntity.class, weekAgo);
        long totalRecent = recentSimpleEvents + recentReferendums + recentMultiPolls;
        
        stats.put("totalRecent", totalRecent);
        stats.put("recentSimpleEvents", recentSimpleEvents);
        stats.put("recentReferendums", recentReferendums);
        stats.put("recentMultiPolls", recentMultiPolls);
        
        // Събития за последния месец
        Instant monthAgo = Instant.now().minus(30, ChronoUnit.DAYS);
        long monthlySimpleEvents = countByCreatedAtAfter(SimpleEventEntity.class, monthAgo);
        long monthlyReferendums = countByCreatedAtAfter(ReferendumEntity.class, monthAgo);
        long monthlyMultiPolls = countByCreatedAtAfter(MultiPollEntity.class, monthAgo);
        long totalMonthly = monthlySimpleEvents + monthlyReferendums + monthlyMultiPolls;
        
        stats.put("totalMonthly", totalMonthly);
        stats.put("monthlySimpleEvents", monthlySimpleEvents);
        stats.put("monthlyReferendums", monthlyReferendums);
        stats.put("monthlyMultiPolls", monthlyMultiPolls);
        
        stats.put("timestamp", Instant.now());
        
        return stats;
    }

    /**
     * Помощен метод за броене по статус
     */
    private <T> long countByStatus(Class<T> entityClass, EventStatus status) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Long> query = cb.createQuery(Long.class);
        Root<T> root = query.from(entityClass);
        query.select(cb.count(root));
        query.where(cb.equal(root.get("eventStatus"), status));
        return entityManager.createQuery(query).getSingleResult();
    }

    /**
     * Помощен метод за броене по дата
     */
    private <T> long countByCreatedAtAfter(Class<T> entityClass, Instant date) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Long> query = cb.createQuery(Long.class);
        Root<T> root = query.from(entityClass);
        query.select(cb.count(root));
        query.where(cb.greaterThanOrEqualTo(root.get("createdAt"), date));
        return entityManager.createQuery(query).getSingleResult();
    }

    /**
     * Връща препоръчани събития за потребителя
     */
    @Transactional(readOnly = true)
    @Override
    public List<EventSimpleViewDTO> getRecommendedEvents(Long userId, int limit) {
        if (userId == null) {
            return new ArrayList<>();
        }
        
        List<EventSimpleViewDTO> recommended = new ArrayList<>();
        
        // Намираме следваните автори - използваме Criteria API
        List<String> followingUsernames = findFollowingUsernames(userId);
        
        if (!followingUsernames.isEmpty()) {
            // Събития от следвани автори
            for (String username : followingUsernames) {
                List<SimpleEventEntity> followingSimpleEvents = simpleEventRepository
                        .findAllByCreatorNameIgnoreCase(username);
                recommended.addAll(followingSimpleEvents.stream()
                        .map(allEventsSimplePreviewMapper::mapSimpleEventToSimpleView)
                        .limit(limit)
                        .toList());
                
                List<ReferendumEntity> followingReferendums = referendumRepository
                        .findAllByCreatorNameIgnoreCase(username);
                recommended.addAll(followingReferendums.stream()
                        .map(allEventsSimplePreviewMapper::mapReferendumToSimpleView)
                        .limit(limit)
                        .toList());
                
                List<MultiPollEntity> followingMultiPolls = multiPollRepository
                        .findAllByCreatorNameIgnoreCase(username);
                recommended.addAll(followingMultiPolls.stream()
                        .map(allEventsSimplePreviewMapper::mapMultiPollToSimpleView)
                        .limit(limit)
                        .toList());
                
                if (recommended.size() >= limit) break;
            }
        }
        
        // Ако няма достатъчно препоръки, добавяме най-новите събития
        if (recommended.size() < limit) {
            int remaining = limit - recommended.size();
            Pageable pageable = PageRequest.of(0, remaining, Sort.by(Sort.Direction.DESC, "createdAt"));
            List<SimpleEventEntity> recentEvents = simpleEventRepository.findAll(pageable).getContent();
            recommended.addAll(recentEvents.stream()
                    .map(allEventsSimplePreviewMapper::mapSimpleEventToSimpleView)
                    .filter(e -> recommended.stream().noneMatch(r -> r.getId().equals(e.getId())))
                    .limit(remaining)
                    .toList());
        }
        
        // Сортираме по дата и ограничаваме
        recommended.sort((e1, e2) -> e2.getCreatedAt().compareTo(e1.getCreatedAt()));
        return recommended.stream().limit(limit).collect(Collectors.toList());
    }

    /**
     * Връща подобни събития
     */
    @Transactional(readOnly = true)
    @Override
    public List<EventSimpleViewDTO> getSimilarEvents(Long eventId, EventType eventType, int limit) {
        List<EventSimpleViewDTO> similar = new ArrayList<>();
        
        // Намираме събитието за да вземем неговите характеристики
        Locations location = null;
        
        switch (eventType) {
            case SIMPLEEVENT:
                SimpleEventEntity simpleEvent = simpleEventRepository.findById(eventId).orElse(null);
                if (simpleEvent != null) {
                    location = simpleEvent.getLocation();
                    // Намираме подобни събития по локация
                    List<SimpleEventEntity> similarEvents = findSimilarByLocation(SimpleEventEntity.class, location, eventId, limit);
                    similar.addAll(similarEvents.stream()
                            .map(allEventsSimplePreviewMapper::mapSimpleEventToSimpleView)
                            .toList());
                }
                break;
            case REFERENDUM:
                ReferendumEntity referendum = referendumRepository.findById(eventId).orElse(null);
                if (referendum != null) {
                    location = referendum.getLocation();
                    List<ReferendumEntity> similarReferendums = findSimilarByLocation(ReferendumEntity.class, location, eventId, limit);
                    similar.addAll(similarReferendums.stream()
                            .map(allEventsSimplePreviewMapper::mapReferendumToSimpleView)
                            .toList());
                }
                break;
            case MULTI_POLL:
                MultiPollEntity multiPoll = multiPollRepository.findById(eventId).orElse(null);
                if (multiPoll != null) {
                    location = multiPoll.getLocation();
                    List<MultiPollEntity> similarMultiPolls = findSimilarByLocation(MultiPollEntity.class, location, eventId, limit);
                    similar.addAll(similarMultiPolls.stream()
                            .map(allEventsSimplePreviewMapper::mapMultiPollToSimpleView)
                            .toList());
                }
                break;
        }
        
        return similar.stream().limit(limit).collect(Collectors.toList());
    }

    /**
     * Намира подобни събития по локация
     */
    @SuppressWarnings("unchecked")
    private <T> List<T> findSimilarByLocation(Class<T> entityClass, Locations location, Long excludeId, int limit) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<T> query = cb.createQuery(entityClass);
        Root<T> root = query.from(entityClass);
        query.select(root);
        
        List<Predicate> predicates = new ArrayList<>();
        if (location != null) {
            predicates.add(cb.equal(root.get("location"), location));
        }
        predicates.add(cb.notEqual(root.get("id"), excludeId));
        
        query.where(cb.and(predicates.toArray(new Predicate[0])));
        query.orderBy(cb.desc(root.get("createdAt")));
        
        TypedQuery<T> typedQuery = entityManager.createQuery(query);
        typedQuery.setMaxResults(limit);
        return typedQuery.getResultList();
    }

    /**
     * Намира usernames на следваните автори
     */
    private List<String> findFollowingUsernames(Long userId) {
        if (userId == null) {
            return new ArrayList<>();
        }
        
        try {
            // Използваме native query за да намерим следваните
            @SuppressWarnings("unchecked")
            List<Object[]> results = entityManager.createNativeQuery(
                    "SELECT u.username FROM user_follows uf " +
                    "INNER JOIN users u ON uf.following_id = u.id " +
                    "WHERE uf.follower_id = :userId " +
                    "LIMIT 10"
            ).setParameter("userId", userId).getResultList();
            
            return results.stream()
                    .filter(row -> row != null && row[0] != null)
                    .map(row -> (String) row[0])
                    .filter(username -> username != null && !username.trim().isEmpty())
                    .collect(Collectors.toList());
        } catch (Exception e) {
            // Ако има грешка при заявката, връщаме празен списък
            return new ArrayList<>();
        }
    }

    /**
     * Record класове за по-добра организация на параметрите
     */
    private record SearchParameters(
            String search, 
            Locations location, 
            EventStatus status,
            Instant dateFrom,
            Instant dateTo,
            Integer minVotes,
            Integer maxVotes,
            String creatorUsername,
            String popularityFilter
    ) {}
}