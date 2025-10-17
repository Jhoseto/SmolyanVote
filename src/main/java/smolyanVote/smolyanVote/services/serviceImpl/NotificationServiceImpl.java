package smolyanVote.smolyanVote.services.serviceImpl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.componentsAndSecurity.NotificationWebSocketHandler;
import smolyanVote.smolyanVote.models.NotificationEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.repositories.NotificationRepository;
import smolyanVote.smolyanVote.services.interfaces.NotificationService;
import smolyanVote.smolyanVote.viewsAndDTO.NotificationDTO;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository repository;
    private final NotificationWebSocketHandler webSocket;

    @Autowired
    public NotificationServiceImpl(NotificationRepository repository,
                                   NotificationWebSocketHandler webSocket) {
        this.repository = repository;
        this.webSocket = webSocket;
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
        entity.setActorImageUrl(actorImageUrl);
        entity.setEntityType(entityType);
        entity.setEntityId(entityId);
        entity.setActionUrl(actionUrl);

        NotificationEntity saved = repository.save(entity);
        webSocket.sendToUser(recipient.getUsername(), NotificationDTO.fromEntity(saved));
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

        create(commentAuthor, "REPLY",
                replier.getUsername() + " отговори на вашия коментар",
                replier.getUsername(), replier.getImageUrl(),
                "COMMENT", commentId, "#comment-" + commentId);
    }

    @Override
    public void notifyLike(UserEntity contentAuthor, UserEntity liker, String entityType, Long entityId) {
        if (isSelf(contentAuthor, liker)) return;

        create(contentAuthor, "LIKE",
                liker.getUsername() + " хареса вашето съдържание",
                liker.getUsername(), liker.getImageUrl(),
                entityType, entityId, buildUrl(entityType, entityId));
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
                null, null, "PUBLICATION", publicationId, "/publications/" + publicationId);
    }

    @Override
    public void notifySignalReviewed(UserEntity author, Long signalId, String status) {
        create(author, "SIGNAL_REVIEWED",
                "Вашият сигнал беше разгледан: " + status,
                null, null, "SIGNAL", signalId, "/signals/" + signalId);
    }

    @Override
    public void notifyRoleChanged(UserEntity user, String newRole) {
        NotificationEntity entity = new NotificationEntity(user, "ROLE_CHANGED",
                "Вашата роля: " + newRole);
        entity.setPriority("HIGH");

        NotificationEntity saved = repository.save(entity);
        webSocket.sendToUser(user.getUsername(), NotificationDTO.fromEntity(saved));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationDTO> getNotifications(UserEntity user, Pageable pageable) {
        return repository.findByRecipient(user, pageable)
                .map(NotificationDTO::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationDTO> getRecent(UserEntity user, int limit) {
        return repository.findTopByRecipient(user, PageRequest.of(0, limit))
                .stream()
                .map(NotificationDTO::fromEntity)
                .toList();
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
        return "/" + entityType.toLowerCase() + "s/" + entityId;
    }

    // ====== NEW FOLLOW/VOTE NOTIFICATIONS ======

    @Override
    public void notifyNewFollower(UserEntity followed, UserEntity follower) {
        if (isSelf(followed, follower)) return;

        create(followed, "NEW_FOLLOWER",
                follower.getUsername() + " започна да ви следва",
                follower.getUsername(), follower.getImageUrl(),
                "USER", follower.getId(), "/profile/" + follower.getUsername());
    }

    @Override
    public void notifyUnfollow(UserEntity unfollowed, UserEntity unfollower) {
        if (isSelf(unfollowed, unfollower)) return;

        create(unfollowed, "UNFOLLOW",
                unfollower.getUsername() + " спря да ви следва",
                unfollower.getUsername(), unfollower.getImageUrl(),
                "USER", unfollower.getId(), "/profile/" + unfollower.getUsername());
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
            case "MULTI_POLL", "MULTIPOLL" -> "/multiPoll/" + eventId;
            default -> "/event/" + eventId;
        };
    }
}