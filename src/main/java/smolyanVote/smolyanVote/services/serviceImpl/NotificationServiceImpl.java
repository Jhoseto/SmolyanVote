package smolyanVote.smolyanVote.services.serviceImpl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.componentsAndSecurity.NotificationWebSocketHandler;
import smolyanVote.smolyanVote.models.NotificationEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.repositories.CommentsRepository;
import smolyanVote.smolyanVote.repositories.NotificationRepository;
import smolyanVote.smolyanVote.repositories.UserRepository;
import smolyanVote.smolyanVote.services.interfaces.NotificationService;
import smolyanVote.smolyanVote.viewsAndDTO.NotificationDTO;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository repository;
    private final NotificationWebSocketHandler webSocket;
    private final UserRepository userRepository;
    private final CommentsRepository commentsRepository;

    public NotificationServiceImpl(NotificationRepository repository,
                                   NotificationWebSocketHandler webSocket,
                                   UserRepository userRepository,
                                   CommentsRepository commentsRepository) {
        this.repository = repository;
        this.webSocket = webSocket;
        this.userRepository = userRepository;
        this.commentsRepository = commentsRepository;
    }

    @Override
    @Async
    public void create(UserEntity recipient, String type, String message,
                       String actorUsername, String actorImageUrl,
                       String entityType, Long entityId, String actionUrl) {

        if (isDuplicate(recipient, type, entityType, entityId, actorUsername)) {
            return;
        }

        NotificationEntity entity = new NotificationEntity(recipient, type, message);
        entity.setActorUsername(actorUsername);
        // actorImageUrl вече не се записва в базата - се взима от UserEntity при mapping
        entity.setEntityType(entityType);
        entity.setEntityId(entityId);
        entity.setActionUrl(actionUrl);

        NotificationEntity saved = repository.save(entity);
        webSocket.sendToUser(recipient.getUsername(), fromEntityWithActorImage(saved));
    }

    @Override
    public void notifyComment(UserEntity author, UserEntity commenter, String entityType, Long entityId) {
        if (isSelf(author, commenter)) return;

        create(author, "COMMENT",
                commenter.getUsername() + " коментира вашето съдържание",
                commenter.getUsername(), commenter.getImageUrl(),
                entityType, entityId, buildUrl(entityType, entityId));
    }

    @Override
    public void notifyReply(UserEntity commentAuthor, UserEntity replier, Long commentId) {
        if (isSelf(commentAuthor, replier)) return;

        // Намираме родителския коментар за да построим правилния URL
        String actionUrl = commentsRepository.findById(commentId)
                .map(parentComment -> {
                    // Намираме към какво съдържание принадлежи коментарът
                    String entityType = null;
                    Long entityId = null;
                    
                    if (parentComment.getPublication() != null) {
                        entityType = "PUBLICATION";
                        entityId = parentComment.getPublication().getId();
                    } else if (parentComment.getEvent() != null) {
                        entityType = "SIMPLEEVENT";
                        entityId = parentComment.getEvent().getId();
                    } else if (parentComment.getReferendum() != null) {
                        entityType = "REFERENDUM";
                        entityId = parentComment.getReferendum().getId();
                    } else if (parentComment.getMultiPoll() != null) {
                        entityType = "MULTI_POLL";
                        entityId = parentComment.getMultiPoll().getId();
                    } else if (parentComment.getSignal() != null) {
                        entityType = "SIGNAL";
                        entityId = parentComment.getSignal().getId();
                    }
                    
                    if (entityType != null && entityId != null) {
                        return buildUrl(entityType, entityId) + "#comment-" + commentId;
                    }
                    return "#comment-" + commentId; // Fallback
                })
                .orElse("#comment-" + commentId);

        create(commentAuthor, "REPLY",
                replier.getUsername() + " отговори на вашия коментар",
                replier.getUsername(), replier.getImageUrl(),
                "COMMENT", commentId, actionUrl);
    }

    @Override
    public void notifyLike(UserEntity contentAuthor, UserEntity liker, String entityType, Long entityId) {
        if (isSelf(contentAuthor, liker)) return;

        String actionUrl = buildActionUrl(entityType, entityId);

        create(contentAuthor, "LIKE",
                liker.getUsername() + " хареса вашето съдържание",
                liker.getUsername(), liker.getImageUrl(),
                entityType, entityId, actionUrl);
    }

    @Override
    public void notifyDislike(UserEntity contentAuthor, UserEntity disliker, String entityType, Long entityId) {
        if (isSelf(contentAuthor, disliker)) return;

        String actionUrl = buildActionUrl(entityType, entityId);

        create(contentAuthor, "DISLIKE",
                disliker.getUsername() + " не хареса вашето съдържание",
                disliker.getUsername(), disliker.getImageUrl(),
                entityType, entityId, actionUrl);
    }

    /**
     * Helper метод за построяване на action URL за коментари и други entity типове
     */
    private String buildActionUrl(String entityType, Long entityId) {
        // Ако е like/dislike на коментар, трябва да намерим към какво съдържание принадлежи
        if ("COMMENT".equalsIgnoreCase(entityType)) {
            return commentsRepository.findById(entityId)
                    .map(comment -> {
                        String parentEntityType = null;
                        Long parentEntityId = null;
                        
                        if (comment.getPublication() != null) {
                            parentEntityType = "PUBLICATION";
                            parentEntityId = comment.getPublication().getId();
                        } else if (comment.getEvent() != null) {
                            parentEntityType = "SIMPLEEVENT";
                            parentEntityId = comment.getEvent().getId();
                        } else if (comment.getReferendum() != null) {
                            parentEntityType = "REFERENDUM";
                            parentEntityId = comment.getReferendum().getId();
                        } else if (comment.getMultiPoll() != null) {
                            parentEntityType = "MULTI_POLL";
                            parentEntityId = comment.getMultiPoll().getId();
                        } else if (comment.getSignal() != null) {
                            parentEntityType = "SIGNAL";
                            parentEntityId = comment.getSignal().getId();
                        }
                        
                        if (parentEntityType != null && parentEntityId != null) {
                            return buildUrl(parentEntityType, parentEntityId) + "#comment-" + entityId;
                        }
                        return "#comment-" + entityId; // Fallback
                    })
                    .orElse("#comment-" + entityId);
        } else {
            return buildUrl(entityType, entityId);
        }
    }

    @Override
    public void notifyMention(UserEntity mentioned, UserEntity mentioner,
                              String entityType, Long entityId, String context) {
        if (isSelf(mentioned, mentioner)) return;

        create(mentioned, "MENTION",
                mentioner.getUsername() + " ви спомена в " + context,
                mentioner.getUsername(), mentioner.getImageUrl(),
                entityType, entityId, buildUrl(entityType, entityId));
    }

    @Override
    public void notifyEventEnded(UserEntity creator, Long eventId, String eventTitle) {
        create(creator, "EVENT_ENDED",
                "Събитието \"" + eventTitle + "\" приключи",
                null, null, "EVENT", eventId, "/event/" + eventId);
    }

    @Override
    public void notifyPublicationApproved(UserEntity author, Long publicationId, String title) {
        create(author, "PUBLICATION_APPROVED",
                "Публикацията \"" + title + "\" беше одобрена",
                null, null, "PUBLICATION", publicationId, "/publications?openModal=" + publicationId);
    }

    @Override
    public void notifySignalReviewed(UserEntity author, Long signalId, String status) {
        create(author, "SIGNAL_REVIEWED",
                "Вашият сигнал беше разгледан: " + status,
                null, null, "SIGNAL", signalId, "/signals/mainView?openSignal=" + signalId);
    }

    @Override
    public void notifyRoleChanged(UserEntity user, String newRole) {
        NotificationEntity entity = new NotificationEntity(user, "ROLE_CHANGED",
                "Вашата роля: " + newRole);
        entity.setPriority("HIGH");

        NotificationEntity saved = repository.save(entity);
        webSocket.sendToUser(user.getUsername(), fromEntityWithActorImage(saved));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationDTO> getNotifications(UserEntity user, Pageable pageable) {
        Page<NotificationEntity> entityPage = repository.findByRecipient(user, pageable);
        
        // Оптимизация: вземаме всички actor usernames наведнъж
        Map<String, String> actorImageMap = entityPage.getContent().stream()
                .filter(n -> n.getActorUsername() != null)
                .map(NotificationEntity::getActorUsername)
                .distinct()
                .collect(Collectors.toMap(
                        username -> username,
                        username -> userRepository.findByUsername(username)
                                .map(UserEntity::getImageUrl)
                                .orElse("")
                ));


        // Map-ваме с допълнени actorImageUrl
        return entityPage.map(entity -> {
            NotificationDTO dto = NotificationDTO.fromEntity(entity);
            if (entity.getActorUsername() != null) {
                dto.setActorImageUrl(actorImageMap.get(entity.getActorUsername()));
            }
            return dto;
        });
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationDTO> getRecent(UserEntity user, int limit) {
        List<NotificationEntity> entities = repository.findTopByRecipient(user, PageRequest.of(0, limit));
        
        // Оптимизация: вземаме всички actor usernames наведнъж
        Map<String, String> actorImageMap = entities.stream()
                .filter(n -> n.getActorUsername() != null)
                .map(NotificationEntity::getActorUsername)
                .distinct()
                .collect(Collectors.toMap(
                        username -> username,
                        username -> userRepository.findByUsername(username)
                                .map(UserEntity::getImageUrl)
                                .orElse("")
                ));
        
        return entities.stream()
                .map(entity -> {
                    NotificationDTO dto = NotificationDTO.fromEntity(entity);
                    // Допълваме actorImageUrl от UserEntity
                    if (entity.getActorUsername() != null) {
                        dto.setActorImageUrl(actorImageMap.get(entity.getActorUsername()));
                    }
                    return dto;
                })
                .toList();
    }
    
    /**
     * Mapping с автоматично допълване на actorImageUrl от UserEntity
     */
    private NotificationDTO fromEntityWithActorImage(NotificationEntity entity) {
        NotificationDTO dto = NotificationDTO.fromEntity(entity);
        
        // Ако има actorUsername, вземаме актуалната снимка от UserEntity
        if (entity.getActorUsername() != null) {
            userRepository.findByUsername(entity.getActorUsername())
                    .ifPresent(user -> dto.setActorImageUrl(user.getImageUrl()));
        }
        
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(UserEntity user) {
        return repository.countUnreadByRecipient(user);
    }

    @Override
    public void markAsRead(Long notificationId, UserEntity user) {
        NotificationEntity entity = repository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Not found"));

        if (!entity.getRecipient().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        entity.setRead(true);
        entity.setReadAt(LocalDateTime.now());
        repository.save(entity);
    }

    @Override
    public void markAllAsRead(UserEntity user) {
        repository.markAllAsReadForUser(user, LocalDateTime.now());
    }

    @Override
    public void delete(Long notificationId, UserEntity user) {
        NotificationEntity entity = repository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Not found"));

        if (!entity.getRecipient().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        repository.delete(entity);
    }

    @Override
    public void deleteAll(UserEntity user) {
        repository.deleteAllByRecipient(user);
    }

    @Override
    public void cleanup(int daysToKeep) {
        repository.deleteOlderThan(LocalDateTime.now().minusDays(daysToKeep));
    }

    private boolean isDuplicate(UserEntity recipient, String type, String entityType,
                                Long entityId, String actorUsername) {
        LocalDateTime since = LocalDateTime.now().minusMinutes(5);
        return repository.existsDuplicateRecent(recipient, type, entityType,
                entityId, actorUsername, since);
    }

    private boolean isSelf(UserEntity user1, UserEntity user2) {
        return user1.getId().equals(user2.getId());
    }

    private String buildUrl(String entityType, Long entityId) {
        if (entityType == null || entityId == null) {
            return "";
        }
        
        return switch (entityType.toUpperCase()) {
            case "PUBLICATION" -> "/publications?openModal=" + entityId;
            case "SIMPLEEVENT", "SIMPLE_EVENT" -> "/event/" + entityId;
            case "REFERENDUM" -> "/referendum/" + entityId;
            case "MULTI_POLL", "MULTIPOLL" -> "/multipoll/" + entityId;
            case "SIGNAL" -> "/signals/mainView?openSignal=" + entityId;
            default -> "/" + entityType.toLowerCase() + "s/" + entityId;
        };
    }

    // ====== NEW FOLLOW/VOTE NOTIFICATIONS ======

    @Override
    public void notifyNewFollower(UserEntity followed, UserEntity follower) {
        if (isSelf(followed, follower)) return;

        create(followed, "NEW_FOLLOWER",
                follower.getUsername() + " започна да ви следва",
                follower.getUsername(), follower.getImageUrl(),
                "USER", follower.getId(), "/user/" + follower.getUsername());
    }

    @Override
    public void notifyUnfollow(UserEntity unfollowed, UserEntity unfollower) {
        if (isSelf(unfollowed, unfollower)) return;

        create(unfollowed, "UNFOLLOW",
                unfollower.getUsername() + " спря да ви следва",
                unfollower.getUsername(), unfollower.getImageUrl(),
                "USER", unfollower.getId(), "/user/" + unfollower.getUsername());
    }

    @Override
    public void notifyNewVote(UserEntity eventCreator, UserEntity voter, String eventType, Long eventId, String eventTitle) {
        if (isSelf(eventCreator, voter)) return;

        String entityTypeFormatted = formatEventType(eventType);
        String actionUrl = buildVoteUrl(eventType, eventId);

        create(eventCreator, "NEW_VOTE",
                voter.getUsername() + " гласува във твоя" + entityTypeFormatted + " \"" + eventTitle + "\"",
                voter.getUsername(), voter.getImageUrl(),
                eventType, eventId, actionUrl);
    }

    // Helper методи за NEW_VOTE
    private String formatEventType(String eventType) {
        return switch (eventType.toUpperCase()) {
            case "SIMPLEEVENT", "SIMPLE_EVENT" -> "т Опростен вид събитие";
            case "REFERENDUM" -> "т референдум";
            case "MULTI_POLL", "MULTIPOLL" -> "та Множествена анкета";
            default -> "то Събитие";
        };
    }

    private String buildVoteUrl(String eventType, Long eventId) {
        return switch (eventType.toUpperCase()) {
            case "SIMPLEEVENT", "SIMPLE_EVENT" -> "/event/" + eventId;
            case "REFERENDUM" -> "/referendum/" + eventId;
            case "MULTI_POLL", "MULTIPOLL" -> "/multipoll/" + eventId;
            default -> "/event/" + eventId;
        };
    }
}