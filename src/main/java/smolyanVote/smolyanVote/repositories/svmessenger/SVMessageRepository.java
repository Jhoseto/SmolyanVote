package smolyanVote.smolyanVote.repositories.svmessenger;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.svmessenger.SVMessageEntity;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Repository за SVMessage entities
 * Оптимизирано за високо performance при infinite scroll
 */
@Repository
public interface SVMessageRepository extends JpaRepository<SVMessageEntity, Long> {
    
    // ========== ОСНОВНИ QUERY МЕТОДИ ==========
    
    /**
     * Вземи съобщения за conversation с pagination
     * Сортирани по дата (най-новите първи за infinite scroll)
     */
    @Query("SELECT m FROM SVMessageEntity m WHERE " +
           "m.conversation.id = :conversationId AND " +
           "m.isDeleted = false " +
           "ORDER BY m.sentAt DESC")
    Page<SVMessageEntity> findByConversationId(@Param("conversationId") Long conversationId, 
                                                 Pageable pageable);
    
    /**
     * Вземи последното съобщение в разговор
     */
    @Query("SELECT m FROM SVMessageEntity m WHERE " +
           "m.conversation.id = :conversationId AND " +
           "m.isDeleted = false " +
           "ORDER BY m.sentAt DESC")
    List<SVMessageEntity> findLastMessage(@Param("conversationId") Long conversationId, 
                                          Pageable pageable);
    
    /**
     * Списък с последното съобщение за всеки разговор
     * Използва се за preview в conversation list
     */
    @Query("SELECT m FROM SVMessageEntity m WHERE m.id IN (" +
           "SELECT MAX(m2.id) FROM SVMessageEntity m2 WHERE " +
           "m2.conversation.id IN :conversationIds AND " +
           "m2.isDeleted = false " +
           "GROUP BY m2.conversation.id)")
    List<SVMessageEntity> findLastMessagesForConversations(@Param("conversationIds") List<Long> conversationIds);
    
    // ========== UNREAD MESSAGES ==========
    
    /**
     * Намери всички непрочетени съобщения в conversation за конкретен user
     */
    @Query("SELECT m FROM SVMessageEntity m WHERE " +
           "m.conversation.id = :conversationId AND " +
           "m.sender.id != :userId AND " +
           "m.isRead = false AND " +
           "m.isDeleted = false " +
           "ORDER BY m.sentAt ASC")
    List<SVMessageEntity> findUnreadMessages(@Param("conversationId") Long conversationId,
                                               @Param("userId") Long userId);
    
    /**
     * Брой непрочетени в conversation за user
     */
    @Query("SELECT COUNT(m) FROM SVMessageEntity m WHERE " +
           "m.conversation.id = :conversationId AND " +
           "m.sender.id != :userId AND " +
           "m.isRead = false AND " +
           "m.isDeleted = false")
    Long countUnreadMessages(@Param("conversationId") Long conversationId,
                              @Param("userId") Long userId);
    
    // ========== UPDATE OPERATIONS ==========
    
    /**
     * Маркира всички съобщения като прочетени
     * Връща броя update-нати records
     */
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
                      @Param("readAt") Instant readAt);
    
    /**
     * Маркира едно съобщение като прочетено
     */
    @Modifying
    @Query("UPDATE SVMessageEntity m SET " +
           "m.isRead = true, " +
           "m.readAt = :readAt " +
           "WHERE m.id = :messageId")
    int markAsRead(@Param("messageId") Long messageId,
                   @Param("readAt") Instant readAt);
    
    /**
     * Soft delete на съобщение
     */
    @Modifying
    @Query("UPDATE SVMessageEntity m SET m.isDeleted = true WHERE m.id = :messageId")
    int softDelete(@Param("messageId") Long messageId);
    
    /**
     * Изтрий всички съобщения в conversation (при изтриване на conversation)
     */
    @Modifying
    @Query("UPDATE SVMessageEntity m SET m.isDeleted = true WHERE m.conversation.id = :conversationId")
    int softDeleteAllInConversation(@Param("conversationId") Long conversationId);
    
    /**
     * Редактирай съобщение
     */
    @Modifying
    @Query("UPDATE SVMessageEntity m SET " +
           "m.messageText = :newText, " +
           "m.isEdited = true, " +
           "m.editedAt = :editedAt " +
           "WHERE m.id = :messageId")
    int editMessage(@Param("messageId") Long messageId,
                    @Param("newText") String newText,
                    @Param("editedAt") Instant editedAt);
    
    // ========== STATISTICS ==========
    
    /**
     * Общ брой съобщения в conversation
     */
    @Query("SELECT COUNT(m) FROM SVMessageEntity m WHERE " +
           "m.conversation.id = :conversationId AND " +
           "m.isDeleted = false")
    Long countByConversation(@Param("conversationId") Long conversationId);
    
    /**
     * Брой съобщения изпратени от user
     */
    @Query("SELECT COUNT(m) FROM SVMessageEntity m WHERE " +
           "m.sender.id = :userId AND " +
           "m.isDeleted = false")
    Long countBySender(@Param("userId") Long userId);
    
    // ========== SEARCH ==========
    
    /**
     * Търси съобщения по текст в conversation
     */
    @Query("SELECT m FROM SVMessageEntity m WHERE " +
           "m.conversation.id = :conversationId AND " +
           "LOWER(m.messageText) LIKE LOWER(CONCAT('%', :query, '%')) AND " +
           "m.isDeleted = false " +
           "ORDER BY m.sentAt DESC")
    List<SVMessageEntity> searchInConversation(@Param("conversationId") Long conversationId,
                                                 @Param("query") String query);
}
