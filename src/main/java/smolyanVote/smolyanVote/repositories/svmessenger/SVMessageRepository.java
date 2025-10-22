package smolyanVote.smolyanVote.repositories.svmessenger;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.svmessenger.SVMessageEntity;

import jakarta.persistence.QueryHint;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SVMessageRepository extends JpaRepository<SVMessageEntity, Long> {

    // ✅ FIX: JOIN FETCH за да избегнем N+1 при sender
    @Query(value = "SELECT DISTINCT m FROM SVMessageEntity m " +
            "LEFT JOIN FETCH m.sender " +
            "WHERE m.conversation.id = :conversationId AND " +
            "m.isDeleted = false " +
            "ORDER BY m.sentAt DESC",
            countQuery = "SELECT COUNT(m) FROM SVMessageEntity m WHERE " +
                    "m.conversation.id = :conversationId AND m.isDeleted = false")
    @QueryHints(@QueryHint(name = "org.hibernate.cacheable", value = "false"))
    Page<SVMessageEntity> findByConversationId(@Param("conversationId") Long conversationId,
                                               Pageable pageable);

    // ✅ FIX: Limit 1 за last message
    @Query("SELECT m FROM SVMessageEntity m " +
            "LEFT JOIN FETCH m.sender " +
            "WHERE m.conversation.id = :conversationId AND " +
            "m.isDeleted = false " +
            "ORDER BY m.sentAt DESC " +
            "LIMIT 1")
    Optional<SVMessageEntity> findLastMessage(@Param("conversationId") Long conversationId);

    @Query("SELECT m FROM SVMessageEntity m " +
            "LEFT JOIN FETCH m.sender " +
            "WHERE m.conversation.id = :conversationId AND " +
            "m.sender.id != :userId AND " +
            "m.isRead = false AND " +
            "m.isDeleted = false " +
            "ORDER BY m.sentAt ASC")
    List<SVMessageEntity> findUnreadMessages(@Param("conversationId") Long conversationId,
                                             @Param("userId") Long userId);

    @Query("SELECT COUNT(m) FROM SVMessageEntity m WHERE " +
            "m.conversation.id = :conversationId AND " +
            "m.sender.id != :userId AND " +
            "m.isRead = false AND " +
            "m.isDeleted = false")
    Long countUnreadMessages(@Param("conversationId") Long conversationId,
                             @Param("userId") Long userId);

    @Modifying
    @Query("UPDATE SVMessageEntity m SET " +
            "m.isRead = true, " +
            "m.readAt = :readAt " +
            "WHERE m.conversation.id = :conversationId AND " +
            "m.sender.id != :userId AND " +
            "m.isRead = false AND " +
            "m.isDeleted = false")
    int markAllAsRead(@Param("conversationId") Long conversationId,
                      @Param("userId") Long userId,
                      @Param("readAt") LocalDateTime readAt);

    @Modifying
    @Query("UPDATE SVMessageEntity m SET " +
            "m.isRead = true, " +
            "m.readAt = :readAt " +
            "WHERE m.id = :messageId")
    int markAsRead(@Param("messageId") Long messageId,
                   @Param("readAt") LocalDateTime readAt);

    @Modifying
    @Query("UPDATE SVMessageEntity m SET m.isDeleted = true WHERE m.id = :messageId")
    int softDelete(@Param("messageId") Long messageId);

    @Modifying
    @Query("UPDATE SVMessageEntity m SET m.isDeleted = true WHERE m.conversation.id = :conversationId")
    int softDeleteAllInConversation(@Param("conversationId") Long conversationId);

    @Modifying
    @Query("UPDATE SVMessageEntity m SET " +
            "m.messageText = :newText, " +
            "m.isEdited = true, " +
            "m.editedAt = :editedAt " +
            "WHERE m.id = :messageId")
    void editMessage(@Param("messageId") Long messageId,
                    @Param("newText") String newText,
                    @Param("editedAt") LocalDateTime editedAt);

    @Query("SELECT COUNT(m) FROM SVMessageEntity m WHERE " +
            "m.conversation.id = :conversationId AND " +
            "m.isDeleted = false")
    Long countByConversation(@Param("conversationId") Long conversationId);

    @Query("SELECT COUNT(m) FROM SVMessageEntity m WHERE " +
            "m.sender.id = :userId AND " +
            "m.isDeleted = false")
    Long countBySender(@Param("userId") Long userId);

    @Query("SELECT m FROM SVMessageEntity m " +
            "LEFT JOIN FETCH m.sender " +
            "WHERE m.conversation.id = :conversationId AND " +
            "LOWER(m.messageText) LIKE LOWER(CONCAT('%', :query, '%')) AND " +
            "m.isDeleted = false " +
            "ORDER BY m.sentAt DESC")
    List<SVMessageEntity> searchInConversation(@Param("conversationId") Long conversationId,
                                               @Param("query") String query);
}