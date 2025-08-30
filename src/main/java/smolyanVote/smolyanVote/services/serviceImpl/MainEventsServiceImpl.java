package smolyanVote.smolyanVote.services.serviceImpl;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
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
import smolyanVote.smolyanVote.services.interfaces.MainEventsService;
import smolyanVote.smolyanVote.services.mappers.AllEventsSimplePreviewMapper;
import smolyanVote.smolyanVote.viewsAndDTO.EventSimpleViewDTO;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
public class MainEventsServiceImpl implements MainEventsService {

    private final AllEventsSimplePreviewMapper allEventsSimplePreviewMapper;
    private final ExecutorService executorService;

    @PersistenceContext
    private EntityManager entityManager;

    public MainEventsServiceImpl(
            AllEventsSimplePreviewMapper allEventsSimplePreviewMapper) {

        this.allEventsSimplePreviewMapper = allEventsSimplePreviewMapper;
        this.executorService = Executors.newFixedThreadPool(3); // За паралелни заявки
    }

    @Transactional(readOnly = true)
    @Override
    public Page<EventSimpleViewDTO> findAllEvents(String search, String location, EventType type, EventStatus status, Pageable pageable) {
        long startTime = System.currentTimeMillis();

        try {
            // Парсваме филтрите
            SearchParameters params = parseSearchParameters(search, location, type, status);

            // Ако имаме специфичен тип, използваме оптимизирана заявка
            if (type != null) {
                return findEventsBySpecificType(params, pageable, type);
            }

            // В противен случай търсим във всички типове паралелно
            return findEventsFromAllTypes(params, pageable);

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

        // Сортираме и прилагаме пагинация
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

        if (!predicates.isEmpty()) {
            query.where(cb.and(predicates.toArray(new Predicate[0])));
        }
    }

    /**
     * Добавя сортиране към query
     */
    private <T> void addSortingToQuery(CriteriaQuery<T> query, Root<?> root, CriteriaBuilder cb, Sort sort) {
        if (sort.isEmpty()) {
            query.orderBy(cb.desc(root.get("createdAt")));
            return;
        }

        List<Order> orders = new ArrayList<>();
        for (Sort.Order order : sort) {
            String property = order.getProperty();
            if ("popularity".equals(property)) {
                property = "totalVotes";
            }

            if (order.isAscending()) {
                orders.add(cb.asc(root.get(property)));
            } else {
                orders.add(cb.desc(root.get(property)));
            }
        }
        query.orderBy(orders);
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

        return new SearchParameters(cleanSearch, locationEnum, statusEnum);
    }

    /**
     * Сортира списък от события
     */
    private void sortEventsList(List<EventSimpleViewDTO> events, Sort sort) {
        if (sort.isEmpty()) {
            events.sort((e1, e2) -> e2.getCreatedAt().compareTo(e1.getCreatedAt()));
            return;
        }

        events.sort((e1, e2) -> {
            for (Sort.Order order : sort) {
                String property = order.getProperty();
                if ("popularity".equals(property)) {
                    property = "totalVotes";
                }

                int comparison = compareEventsByProperty(e1, e2, property);
                if (comparison != 0) {
                    return order.isAscending() ? comparison : -comparison;
                }
            }
            return 0;
        });
    }

    /**
     * Сравнява два събития по определено свойство
     */
    private int compareEventsByProperty(EventSimpleViewDTO e1, EventSimpleViewDTO e2, String property) {
        try {
            return switch (property) {
                case "title" -> compareStrings(e1.getTitle(), e2.getTitle());
                case "totalVotes" -> compareIntegers(e1.getTotalVotes(), e2.getTotalVotes());
                case "createdAt" -> e1.getCreatedAt().compareTo(e2.getCreatedAt());
                case "creatorName" -> compareStrings(e1.getCreatorName(), e2.getCreatorName());
                case "location" -> compareEnums(e1.getLocation(), e2.getLocation());
                case "status" -> compareEnums(e1.getEventStatus(), e2.getEventStatus());
                case "viewCounter" -> compareIntegers(e1.getViewCounter(), e2.getViewCounter());
                case "eventType" -> compareEnums(e1.getEventType(), e2.getEventType());
                default -> 0;
            };
        } catch (Exception e) {
            return 0;
        }
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
     * Record класове за по-добра организация на параметрите
     */
    private record SearchParameters(String search, Locations location, EventStatus status) {}
}