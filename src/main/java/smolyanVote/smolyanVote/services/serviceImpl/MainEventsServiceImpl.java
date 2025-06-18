package smolyanVote.smolyanVote.services.serviceImpl;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.MultiPollEntity;
import smolyanVote.smolyanVote.models.ReferendumEntity;
import smolyanVote.smolyanVote.models.SimpleEventEntity;
import smolyanVote.smolyanVote.models.enums.EventStatus;
import smolyanVote.smolyanVote.models.enums.Locations;
import smolyanVote.smolyanVote.repositories.MultiPollRepository;
import smolyanVote.smolyanVote.repositories.ReferendumRepository;
import smolyanVote.smolyanVote.repositories.SimpleEventRepository;
import smolyanVote.smolyanVote.services.interfaces.MainEventsService;
import smolyanVote.smolyanVote.services.mappers.AllEventsSimplePreviewMapper;
import smolyanVote.smolyanVote.viewsAndDTO.EventSimpleViewDTO;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class MainEventsServiceImpl implements MainEventsService {

    private final SimpleEventRepository simpleEventRepository;
    private final ReferendumRepository referendumRepository;
    private final MultiPollRepository multiPollRepository;
    private final AllEventsSimplePreviewMapper allEventsSimplePreviewMapper;

    @PersistenceContext
    private EntityManager entityManager;

    public MainEventsServiceImpl(
            SimpleEventRepository simpleEventRepository,
            ReferendumRepository referendumRepository,
            MultiPollRepository multiPollRepository,
            AllEventsSimplePreviewMapper allEventsSimplePreviewMapper) {
        this.simpleEventRepository = simpleEventRepository;
        this.referendumRepository = referendumRepository;
        this.multiPollRepository = multiPollRepository;
        this.allEventsSimplePreviewMapper = allEventsSimplePreviewMapper;
    }

    @Transactional(readOnly = true)
    @Override
    public Page<EventSimpleViewDTO> findAllEvents(String search, String location, String type, String status, Pageable pageable) {
        // Събираме всички събития от трите типа
        List<EventSimpleViewDTO> allEvents = new ArrayList<>();

        // Парсваме филтрите веднъж
        Locations locationFilter = parseLocation(location);
        EventStatus statusFilter = parseStatus(status);

        // Ако няма филтър по тип или е "event"
        if (type == null || type.trim().isEmpty() || "event".equalsIgnoreCase(type.trim())) {
            List<SimpleEventEntity> simpleEvents = getFilteredSimpleEvents(search, locationFilter, statusFilter);
            allEvents.addAll(simpleEvents.stream()
                    .map(allEventsSimplePreviewMapper::mapSimpleEventToSimpleView)
                    .toList());
        }

        // Ако няма филтър по тип или е "referendum"
        if (type == null || type.trim().isEmpty() || "referendum".equalsIgnoreCase(type.trim())) {
            List<ReferendumEntity> referendums = getFilteredReferendums(search, locationFilter, statusFilter);
            allEvents.addAll(referendums.stream()
                    .map(allEventsSimplePreviewMapper::mapReferendumToSimpleView)
                    .toList());
        }

        // Ако няма филтър по тип или е "poll"
        if (type == null || type.trim().isEmpty() || "poll".equalsIgnoreCase(type.trim())) {
            List<MultiPollEntity> multiPolls = getFilteredMultiPolls(search, locationFilter, statusFilter);
            allEvents.addAll(multiPolls.stream()
                    .map(allEventsSimplePreviewMapper::mapMultiPollToSimpleView)
                    .toList());
        }

        // Сортираме резултатите
        sortEvents(allEvents, pageable.getSort());

        // Прилагаме pagination
        return applyPagination(allEvents, pageable);
    }

    @Override
    public List<EventSimpleViewDTO> getAllUserEvents(String email) {
        List<EventSimpleViewDTO> userEvents = new ArrayList<>();

        // Намираме SimpleEvents на потребителя
        List<SimpleEventEntity> userSimpleEvents = getSimpleEventsByCreatorEmail(email);
        userEvents.addAll(userSimpleEvents.stream()
                .map(allEventsSimplePreviewMapper::mapSimpleEventToSimpleView)
                .toList());

        // Намираме Referendums на потребителя
        List<ReferendumEntity> userReferendums = getReferendumsByCreatorEmail(email);
        userEvents.addAll(userReferendums.stream()
                .map(allEventsSimplePreviewMapper::mapReferendumToSimpleView)
                .toList());

        // Намираме MultiPolls на потребителя
        List<MultiPollEntity> userMultiPolls = getMultiPollsByCreatorEmail(email);
        userEvents.addAll(userMultiPolls.stream()
                .map(allEventsSimplePreviewMapper::mapMultiPollToSimpleView)
                .toList());

        // Сортираме по дата на създаване (най-новите първо)
        userEvents.sort((e1, e2) -> e2.getCreatedAt().compareTo(e1.getCreatedAt()));

        return userEvents;
    }

    // Методи за извличане на филтрирани събития
    private List<SimpleEventEntity> getFilteredSimpleEvents(String search, Locations location, EventStatus status) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<SimpleEventEntity> query = cb.createQuery(SimpleEventEntity.class);
        Root<SimpleEventEntity> root = query.from(SimpleEventEntity.class);

        List<Predicate> predicates = buildPredicatesForEntity(root, cb, search, location, status);
        if (!predicates.isEmpty()) {
            query.where(cb.and(predicates.toArray(new Predicate[0])));
        }

        return entityManager.createQuery(query).getResultList();
    }

    private List<ReferendumEntity> getFilteredReferendums(String search, Locations location, EventStatus status) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<ReferendumEntity> query = cb.createQuery(ReferendumEntity.class);
        Root<ReferendumEntity> root = query.from(ReferendumEntity.class);

        List<Predicate> predicates = buildPredicatesForEntity(root, cb, search, location, status);
        if (!predicates.isEmpty()) {
            query.where(cb.and(predicates.toArray(new Predicate[0])));
        }

        return entityManager.createQuery(query).getResultList();
    }

    private List<MultiPollEntity> getFilteredMultiPolls(String search, Locations location, EventStatus status) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<MultiPollEntity> query = cb.createQuery(MultiPollEntity.class);
        Root<MultiPollEntity> root = query.from(MultiPollEntity.class);

        List<Predicate> predicates = buildPredicatesForEntity(root, cb, search, location, status);
        if (!predicates.isEmpty()) {
            query.where(cb.and(predicates.toArray(new Predicate[0])));
        }

        return entityManager.createQuery(query).getResultList();
    }


    // Методи за извличане на събития по creator email
    private List<SimpleEventEntity> getSimpleEventsByCreatorEmail(String email) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<SimpleEventEntity> query = cb.createQuery(SimpleEventEntity.class);
        Root<SimpleEventEntity> root = query.from(SimpleEventEntity.class);

        query.where(cb.equal(root.get("creatorEmail"), email));
        query.orderBy(cb.desc(root.get("createdAt")));

        return entityManager.createQuery(query).getResultList();
    }

    private List<ReferendumEntity> getReferendumsByCreatorEmail(String email) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<ReferendumEntity> query = cb.createQuery(ReferendumEntity.class);
        Root<ReferendumEntity> root = query.from(ReferendumEntity.class);

        query.where(cb.equal(root.get("creatorEmail"), email));
        query.orderBy(cb.desc(root.get("createdAt")));

        return entityManager.createQuery(query).getResultList();
    }

    private List<MultiPollEntity> getMultiPollsByCreatorEmail(String email) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<MultiPollEntity> query = cb.createQuery(MultiPollEntity.class);
        Root<MultiPollEntity> root = query.from(MultiPollEntity.class);

        query.where(cb.equal(root.get("creatorEmail"), email));
        query.orderBy(cb.desc(root.get("createdAt")));

        return entityManager.createQuery(query).getResultList();
    }

    // Помощни методи
    private List<Predicate> buildPredicatesForEntity(Root<?> root, CriteriaBuilder cb, String search, Locations location, EventStatus status) {
        List<Predicate> predicates = new ArrayList<>();

        // Търсене по заглавие или creatorName
        if (search != null && !search.trim().isEmpty()) {
            String searchLower = search.trim().toLowerCase();
            predicates.add(cb.or(
                    cb.like(cb.lower(root.get("title")), "%" + searchLower + "%"),
                    cb.like(cb.lower(root.get("creatorName")), "%" + searchLower + "%")
            ));
        }

        // Филтър по локация
        if (location != null) {
            predicates.add(cb.equal(root.get("location"), location));
        }

        // Филтър по статус
        if (status != null) {
            predicates.add(cb.equal(root.get("status"), status));
        }

        return predicates;
    }

    private Locations parseLocation(String location) {
        if (location == null || location.trim().isEmpty()) {
            return null;
        }
        try {
            return Locations.valueOf(location.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private EventStatus parseStatus(String status) {
        if (status == null || status.trim().isEmpty()) {
            return null;
        }
        try {
            return EventStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private void sortEvents(List<EventSimpleViewDTO> events, org.springframework.data.domain.Sort sort) {
        if (sort.isEmpty()) {
            return;
        }

        events.sort((e1, e2) -> {
            for (org.springframework.data.domain.Sort.Order order : sort) {
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

    private int compareEventsByProperty(EventSimpleViewDTO e1, EventSimpleViewDTO e2, String property) {
        try {
            switch (property) {
                case "title":
                    return compareStrings(e1.getTitle(), e2.getTitle());
                case "totalVotes":
                    return compareIntegers(e1.getTotalVotes(), e2.getTotalVotes());
                case "createdAt":
                    return compareInstants(e1.getCreatedAt(), e2.getCreatedAt());
                case "creatorName":
                    return compareStrings(e1.getCreatorName(), e2.getCreatorName());
                case "location":
                    return compareEnums(e1.getLocation(), e2.getLocation());
                case "status":
                    return compareEnums(e1.getEventStatus(), e2.getEventStatus());
                case "viewCounter":
                    return compareIntegers(e1.getViewCounter(), e2.getViewCounter());
                case "eventType":
                    return compareEnums(e1.getEventType(), e2.getEventType());
                default:
                    return 0;
            }
        } catch (Exception e) {
            // Ако има проблем с някое поле, връщаме 0 (равни)
            return 0;
        }
    }

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

    private int compareDateTimes(LocalDateTime d1, LocalDateTime d2) {
        if (d1 == null && d2 == null) return 0;
        if (d1 == null) return -1;
        if (d2 == null) return 1;
        return d1.compareTo(d2);
    }

    private int compareInstants(Instant i1, Instant i2) {
        if (i1 == null && i2 == null) return 0;
        if (i1 == null) return -1;
        if (i2 == null) return 1;
        return i1.compareTo(i2);
    }

    private int compareEnums(Enum<?> e1, Enum<?> e2) {
        if (e1 == null && e2 == null) return 0;
        if (e1 == null) return -1;
        if (e2 == null) return 1;
        return e1.toString().compareToIgnoreCase(e2.toString());
    }

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
}