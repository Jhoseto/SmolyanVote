package smolyanVote.smolyanVote.repositories.svmessenger;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.svmessenger.SVConversationEntity;

import java.util.List;
import java.util.Optional;

/**
 * Repository за SVConversation entities
 * Всички методи са оптимизирани за performance
 */
@Repository
public interface SVConversationRepository extends JpaRepository<SVConversationEntity, Long> {
    
    // ========== ОСНОВНИ QUERY МЕТОДИ ==========
    
    /**
     * Намери разговор между двама потребители
     * Работи с всяка комбинация от userId1 и userId2
     */
    @Query("SELECT c FROM SVConversationEntity c WHERE " +
           "((c.user1.id = :userId1 AND c.user2.id = :userId2) OR " +
           "(c.user1.id = :userId2 AND c.user2.id = :userId1)) AND " +
           "c.isDeleted = false")
    Optional<SVConversationEntity> findByTwoUsers(@Param("userId1") Long userId1, 
                                                    @Param("userId2") Long userId2);
    
    /**
     * Провери дали съществува разговор между двама users
     */
    @Query("SELECT COUNT(c) > 0 FROM SVConversationEntity c WHERE " +
           "((c.user1.id = :userId1 AND c.user2.id = :userId2) OR " +
           "(c.user1.id = :userId2 AND c.user2.id = :userId1)) AND " +
           "c.isDeleted = false")
    boolean existsBetweenUsers(@Param("userId1") Long userId1, 
                                @Param("userId2") Long userId2);
    
    /**
     * Всички активни разговори на потребител
     * Сортирани по последно съобщение (най-скорошните отгоре)
     */
    @Query("SELECT c FROM SVConversationEntity c WHERE " +
           "(c.user1.id = :userId OR c.user2.id = :userId) AND " +
           "c.isDeleted = false " +
           "ORDER BY c.updatedAt DESC")
    List<SVConversationEntity> findAllActiveByUser(@Param("userId") Long userId);
    
    /**
     * Брой активни разговори на user
     */
    @Query("SELECT COUNT(c) FROM SVConversationEntity c WHERE " +
           "(c.user1.id = :userId OR c.user2.id = :userId) AND " +
           "c.isDeleted = false")
    Long countActiveByUser(@Param("userId") Long userId);
    
    // ========== UNREAD COUNT QUERIES ==========
    
    /**
     * Брой разговори с непрочетени съобщения за user
     */
    @Query("SELECT COUNT(c) FROM SVConversationEntity c WHERE " +
           "((c.user1.id = :userId AND c.user1UnreadCount > 0) OR " +
           "(c.user2.id = :userId AND c.user2UnreadCount > 0)) AND " +
           "c.isDeleted = false")
    Long countUnreadConversations(@Param("userId") Long userId);
    
    /**
     * Общ брой непрочетени съобщения за user (от всички разговори)
     */
    @Query("SELECT COALESCE(SUM(CASE " +
           "WHEN c.user1.id = :userId THEN c.user1UnreadCount " +
           "WHEN c.user2.id = :userId THEN c.user2UnreadCount " +
           "ELSE 0 END), 0) " +
           "FROM SVConversationEntity c WHERE " +
           "(c.user1.id = :userId OR c.user2.id = :userId) AND " +
           "c.isDeleted = false")
    Long getTotalUnreadCount(@Param("userId") Long userId);
    
    // ========== UPDATE OPERATIONS ==========
    
    /**
     * Нулира unread count за user в конкретен conversation
     */
    @Modifying
    @Query("UPDATE SVConversationEntity c SET " +
           "c.user1UnreadCount = CASE WHEN c.user1.id = :userId THEN 0 ELSE c.user1UnreadCount END, " +
           "c.user2UnreadCount = CASE WHEN c.user2.id = :userId THEN 0 ELSE c.user2UnreadCount END " +
           "WHERE c.id = :conversationId")
    int resetUnreadCount(@Param("conversationId") Long conversationId, 
                         @Param("userId") Long userId);
    
    /**
     * Soft delete на conversation
     */
    @Modifying
    @Query("UPDATE SVConversationEntity c SET c.isDeleted = true WHERE c.id = :conversationId")
    int softDelete(@Param("conversationId") Long conversationId);
    
    /**
     * Restore на soft deleted conversation
     */
    @Modifying
    @Query("UPDATE SVConversationEntity c SET c.isDeleted = false WHERE c.id = :conversationId")
    int restore(@Param("conversationId") Long conversationId);
    
    // ========== SEARCH & FILTER ==========
    
    /**
     * Търсене на разговори по username на другия user
     */
    @Query("SELECT c FROM SVConversationEntity c WHERE " +
           "(c.user1.id = :userId AND LOWER(c.user2.username) LIKE LOWER(CONCAT('%', :query, '%'))) OR " +
           "(c.user2.id = :userId AND LOWER(c.user1.username) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "c.isDeleted = false " +
           "ORDER BY c.updatedAt DESC")
    List<SVConversationEntity> searchByUsername(@Param("userId") Long userId, 
                                                  @Param("query") String query);
}
