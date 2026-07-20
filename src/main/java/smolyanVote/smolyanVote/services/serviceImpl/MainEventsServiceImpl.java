package smolyanVote.smolyanVote.services.serviceImpl;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.*;
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
import smolyanVote.smolyanVote.viewsAndDTO.apiv1.EventsCatalogResponse;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class MainEventsServiceImpl implements MainEventsService {

    private final AllEventsSimplePreviewMapper allEventsSimplePreviewMapper;
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
    }

    @Transactional(readOnly = true)
    @Override
    public EventsCatalogResponse getEventsCatalog(Long currentUserId) {
        List<EventSimpleViewDTO> events = loadAllEvents();
        events.sort((a, b) -> {
            if (a.getCreatedAt() == null && b.getCreatedAt() == null) return 0;
            if (a.getCreatedAt() == null) return 1;
            if (b.getCreatedAt() == null) return -1;
            return b.getCreatedAt().compareTo(a.getCreatedAt());
        });

        if (currentUserId == null) {
            return new EventsCatalogResponse(events, List.of(), List.of());
        }

        List<String> following = userFollowRepository.findFollowingUsernames(currentUserId).stream()
                .filter(StringUtils::hasText)
                .toList();
        List<String> votedKeys = buildVotedKeys(currentUserId);
        return new EventsCatalogResponse(events, following, votedKeys);
    }

    private List<EventSimpleViewDTO> loadAllEvents() {
        List<EventSimpleViewDTO> events = new ArrayList<>();
        simpleEventRepository.findAll().forEach(e ->
                events.add(allEventsSimplePreviewMapper.mapSimpleEventToSimpleView(e)));
        referendumRepository.findAll().forEach(e ->
                events.add(allEventsSimplePreviewMapper.mapReferendumToSimpleView(e)));
        multiPollRepository.findAll().forEach(e ->
                events.add(allEventsSimplePreviewMapper.mapMultiPollToSimpleView(e)));
        return events;
    }

    private List<String> buildVotedKeys(Long userId) {
        List<String> keys = new ArrayList<>();
        voteSimpleEventRepository.findVotedEventIdsByUserId(userId)
                .forEach(id -> keys.add(EventType.SIMPLEEVENT.name() + ":" + id));
        voteReferendumRepository.findVotedReferendumIdsByUserId(userId)
                .forEach(id -> keys.add(EventType.REFERENDUM.name() + ":" + id));
        voteMultiPollRepository.findVotedMultiPollIdsByUserId(userId)
                .forEach(id -> keys.add(EventType.MULTI_POLL.name() + ":" + id));
        return keys;
    }

    @Transactional(readOnly = true)
    @Override
    public List<EventSimpleViewDTO> getAllUserEvents(String username) {
        if (!StringUtils.hasText(username)) {
            return new ArrayList<>();
        }

        try {
            List<EventSimpleViewDTO> userEvents = new ArrayList<>();
            userEvents.addAll(getSimpleEventsByCreatorUsername(username).stream()
                    .map(allEventsSimplePreviewMapper::mapSimpleEventToSimpleView)
                    .toList());
            userEvents.addAll(getReferendumsByCreatorUsername(username).stream()
                    .map(allEventsSimplePreviewMapper::mapReferendumToSimpleView)
                    .toList());
            userEvents.addAll(getMultiPollsByCreatorUsername(username).stream()
                    .map(allEventsSimplePreviewMapper::mapMultiPollToSimpleView)
                    .toList());
            userEvents.sort((e1, e2) -> e2.getCreatedAt().compareTo(e1.getCreatedAt()));
            return userEvents;
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

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

    @Transactional(readOnly = true)
    @Override
    public Map<String, Object> getEventsStatistics() {
        Map<String, Object> stats = new HashMap<>();

        long totalSimpleEvents = simpleEventRepository.count();
        long totalReferendums = referendumRepository.count();
        long totalMultiPolls = multiPollRepository.count();
        stats.put("totalEvents", totalSimpleEvents + totalReferendums + totalMultiPolls);
        stats.put("totalSimpleEvents", totalSimpleEvents);
        stats.put("totalReferendums", totalReferendums);
        stats.put("totalMultiPolls", totalMultiPolls);

        long activeSimpleEvents = countByStatus(SimpleEventEntity.class, EventStatus.ACTIVE);
        long activeReferendums = countByStatus(ReferendumEntity.class, EventStatus.ACTIVE);
        long activeMultiPolls = countByStatus(MultiPollEntity.class, EventStatus.ACTIVE);
        stats.put("totalActive", activeSimpleEvents + activeReferendums + activeMultiPolls);
        stats.put("activeSimpleEvents", activeSimpleEvents);
        stats.put("activeReferendums", activeReferendums);
        stats.put("activeMultiPolls", activeMultiPolls);

        Instant weekAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        long recentSimpleEvents = countByCreatedAtAfter(SimpleEventEntity.class, weekAgo);
        long recentReferendums = countByCreatedAtAfter(ReferendumEntity.class, weekAgo);
        long recentMultiPolls = countByCreatedAtAfter(MultiPollEntity.class, weekAgo);
        stats.put("totalRecent", recentSimpleEvents + recentReferendums + recentMultiPolls);
        stats.put("recentSimpleEvents", recentSimpleEvents);
        stats.put("recentReferendums", recentReferendums);
        stats.put("recentMultiPolls", recentMultiPolls);

        Instant monthAgo = Instant.now().minus(30, ChronoUnit.DAYS);
        long monthlySimpleEvents = countByCreatedAtAfter(SimpleEventEntity.class, monthAgo);
        long monthlyReferendums = countByCreatedAtAfter(ReferendumEntity.class, monthAgo);
        long monthlyMultiPolls = countByCreatedAtAfter(MultiPollEntity.class, monthAgo);
        stats.put("totalMonthly", monthlySimpleEvents + monthlyReferendums + monthlyMultiPolls);
        stats.put("monthlySimpleEvents", monthlySimpleEvents);
        stats.put("monthlyReferendums", monthlyReferendums);
        stats.put("monthlyMultiPolls", monthlyMultiPolls);
        stats.put("timestamp", Instant.now());

        return stats;
    }

    private <T> long countByStatus(Class<T> entityClass, EventStatus status) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Long> query = cb.createQuery(Long.class);
        Root<T> root = query.from(entityClass);
        query.select(cb.count(root));
        query.where(cb.equal(root.get("eventStatus"), status));
        return entityManager.createQuery(query).getSingleResult();
    }

    private <T> long countByCreatedAtAfter(Class<T> entityClass, Instant date) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Long> query = cb.createQuery(Long.class);
        Root<T> root = query.from(entityClass);
        query.select(cb.count(root));
        query.where(cb.greaterThanOrEqualTo(root.get("createdAt"), date));
        return entityManager.createQuery(query).getSingleResult();
    }

    @Transactional(readOnly = true)
    @Override
    public List<EventSimpleViewDTO> getRecommendedEvents(Long userId, int limit) {
        if (userId == null) {
            return new ArrayList<>();
        }

        List<EventSimpleViewDTO> recommended = new ArrayList<>();
        List<String> followingUsernames = userFollowRepository.findFollowingUsernames(userId).stream()
                .filter(StringUtils::hasText)
                .toList();

        if (!followingUsernames.isEmpty()) {
            for (String username : followingUsernames) {
                recommended.addAll(simpleEventRepository.findAllByCreatorNameIgnoreCase(username).stream()
                        .map(allEventsSimplePreviewMapper::mapSimpleEventToSimpleView)
                        .limit(limit)
                        .toList());
                recommended.addAll(referendumRepository.findAllByCreatorNameIgnoreCase(username).stream()
                        .map(allEventsSimplePreviewMapper::mapReferendumToSimpleView)
                        .limit(limit)
                        .toList());
                recommended.addAll(multiPollRepository.findAllByCreatorNameIgnoreCase(username).stream()
                        .map(allEventsSimplePreviewMapper::mapMultiPollToSimpleView)
                        .limit(limit)
                        .toList());
                if (recommended.size() >= limit) break;
            }
        }

        if (recommended.size() < limit) {
            int remaining = limit - recommended.size();
            Pageable pageable = PageRequest.of(0, remaining, Sort.by(Sort.Direction.DESC, "createdAt"));
            recommended.addAll(simpleEventRepository.findAll(pageable).getContent().stream()
                    .map(allEventsSimplePreviewMapper::mapSimpleEventToSimpleView)
                    .filter(e -> recommended.stream().noneMatch(r -> r.getId().equals(e.getId())))
                    .limit(remaining)
                    .toList());
        }

        recommended.sort((e1, e2) -> e2.getCreatedAt().compareTo(e1.getCreatedAt()));
        return recommended.stream().limit(limit).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    @Override
    public List<EventSimpleViewDTO> getSimilarEvents(Long eventId, EventType eventType, int limit) {
        List<EventSimpleViewDTO> similar = new ArrayList<>();
        Locations location = null;

        switch (eventType) {
            case SIMPLEEVENT -> {
                SimpleEventEntity simpleEvent = simpleEventRepository.findById(eventId).orElse(null);
                if (simpleEvent != null) {
                    location = simpleEvent.getLocation();
                    similar.addAll(findSimilarByLocation(SimpleEventEntity.class, location, eventId, limit).stream()
                            .map(allEventsSimplePreviewMapper::mapSimpleEventToSimpleView)
                            .toList());
                }
            }
            case REFERENDUM -> {
                ReferendumEntity referendum = referendumRepository.findById(eventId).orElse(null);
                if (referendum != null) {
                    location = referendum.getLocation();
                    similar.addAll(findSimilarByLocation(ReferendumEntity.class, location, eventId, limit).stream()
                            .map(allEventsSimplePreviewMapper::mapReferendumToSimpleView)
                            .toList());
                }
            }
            case MULTI_POLL -> {
                MultiPollEntity multiPoll = multiPollRepository.findById(eventId).orElse(null);
                if (multiPoll != null) {
                    location = multiPoll.getLocation();
                    similar.addAll(findSimilarByLocation(MultiPollEntity.class, location, eventId, limit).stream()
                            .map(allEventsSimplePreviewMapper::mapMultiPollToSimpleView)
                            .toList());
                }
            }
        }

        return similar.stream().limit(limit).collect(Collectors.toList());
    }

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
}
