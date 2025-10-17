package smolyanVote.smolyanVote.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.NotificationEntity;
import smolyanVote.smolyanVote.models.UserEntity;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Минималистичен repository с всички необходими query-та
 */
@Repository
public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {

    // ====== ОСНОВНИ QUERIES ======

    /**
     * Намиране на нотификации за потребител
     */
    @Query("SELECT n FROM NotificationEntity n WHERE n.recipient = :user ORDER BY n.createdAt DESC")
    Page<NotificationEntity> findByRecipient(@Param("user") UserEntity user, Pageable pageable);

    /**
     * Броене на непрочетени нотификации
     */
    @Query("SELECT COUNT(n) FROM NotificationEntity n WHERE n.recipient = :user AND n.isRead = false")
    long countUnreadByRecipient(@Param("user") UserEntity user);

    /**
     * Последни N нотификации
     */
    @Query("SELECT n FROM NotificationEntity n WHERE n.recipient = :user ORDER BY n.createdAt DESC")
    List<NotificationEntity> findTopByRecipient(@Param("user") UserEntity user, Pageable pageable);

    /**
     * Само непрочетени нотификации
     */
    @Query("SELECT n FROM NotificationEntity n WHERE n.recipient = :user AND n.isRead = false ORDER BY n.createdAt DESC")
    List<NotificationEntity> findUnreadByRecipient(@Param("user") UserEntity user);

    // ====== BULK OPERATIONS ======

    /**
     * Маркиране на всички като прочетени
     */
    @Modifying
    @Query("UPDATE NotificationEntity n SET n.isRead = true, n.readAt = :readAt WHERE n.recipient = :user AND n.isRead = false")
    int markAllAsReadForUser(@Param("user") UserEntity user, @Param("readAt") LocalDateTime readAt);

    /**
     * Изтриване на стари нотификации
     */
    @Modifying
    @Query("DELETE FROM NotificationEntity n WHERE n.createdAt < :date")
    int deleteOlderThan(@Param("date") LocalDateTime date);

    /**
     * Изтриване на всички нотификации за потребител
     */
    @Modifying
    @Query("DELETE FROM NotificationEntity n WHERE n.recipient = :user")
    int deleteAllByRecipient(@Param("user") UserEntity user);

    // ====== DUPLICATE PREVENTION ======

    /**
     * Проверка за дубликатна нотификация (последните 5 минути)
     */
    @Query("SELECT COUNT(n) > 0 FROM NotificationEntity n WHERE " +
            "n.recipient = :user AND n.type = :type AND " +
            "n.entityType = :entityType AND n.entityId = :entityId AND " +
            "n.actorUsername = :actorUsername AND " +
            "n.createdAt > :since")
    boolean existsDuplicateRecent(
            @Param("user") UserEntity user,
            @Param("type") String type,
            @Param("entityType") String entityType,
            @Param("entityId") Long entityId,
            @Param("actorUsername") String actorUsername,
            @Param("since") LocalDateTime since
    );
}