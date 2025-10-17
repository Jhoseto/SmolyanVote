package smolyanVote.smolyanVote.services.interfaces;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.viewsAndDTO.NotificationDTO;

import java.util.List;

/**
 * Минимален интерфейс - максимална функционалност
 */
public interface NotificationService {

    // ====== CREATE (единствен create метод) ======

    void create(UserEntity recipient, String type, String message,
                String actorUsername, String actorImageUrl,
                String entityType, Long entityId, String actionUrl);

    // ====== SOCIAL SHORTCUTS ======

    void notifyComment(UserEntity author, UserEntity commenter, String entityType, Long entityId);
    void notifyReply(UserEntity commentAuthor, UserEntity replier, Long commentId);
    void notifyLike(UserEntity contentAuthor, UserEntity liker, String entityType, Long entityId);
    void notifyMention(UserEntity mentioned, UserEntity mentioner, String entityType, Long entityId, String context);

    // ====== SYSTEM SHORTCUTS ======

    void notifyEventEnded(UserEntity creator, Long eventId, String eventTitle);
    void notifyPublicationApproved(UserEntity author, Long publicationId, String title);
    void notifySignalReviewed(UserEntity author, Long signalId, String status);
    void notifyRoleChanged(UserEntity user, String newRole);

    // ====== READ ======

    Page<NotificationDTO> getNotifications(UserEntity user, Pageable pageable);
    List<NotificationDTO> getRecent(UserEntity user, int limit);
    long getUnreadCount(UserEntity user);

    // ====== UPDATE ======

    void markAsRead(Long notificationId, UserEntity user);
    void markAllAsRead(UserEntity user);

    // ====== DELETE ======

    void delete(Long notificationId, UserEntity user);
    void deleteAll(UserEntity user);
    void cleanup(int daysToKeep);
}