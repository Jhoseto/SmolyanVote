package smolyanVote.smolyanVote.repositories.svmessenger;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.svmessenger.SVConversationEntity;

import java.util.List;

@Repository
public interface SVConversationRepository extends JpaRepository<SVConversationEntity, Long> {

        // Групите също имат user1/user2 (създателя), затова всяка direct заявка
        // изрично филтрира по conversationType, за да не изтичат групи в 1:1 списъците.
        String DIRECT = "c.conversationType = smolyanVote.smolyanVote.models.svmessenger.ConversationType.DIRECT";

        // ✅ FIX: JOIN FETCH за да избегнем N+1 problem - едностранно hiding
        @Query("SELECT DISTINCT c FROM SVConversationEntity c " +
                        "LEFT JOIN FETCH c.user1 " +
                        "LEFT JOIN FETCH c.user2 " +
                        "WHERE (c.user1.id = :userId OR c.user2.id = :userId) AND " +
                        "c.isDeleted = false AND " + DIRECT + " AND " +
                        "CASE WHEN c.user1.id = :userId THEN c.user1Hidden = false " +
                        "     WHEN c.user2.id = :userId THEN c.user2Hidden = false " +
                        "     ELSE true END " +
                        "ORDER BY c.updatedAt DESC")
        List<SVConversationEntity> findAllActiveByUser(@Param("userId") Long userId);

        /** Active GROUP conversations the user still belongs to. */
        @Query("SELECT DISTINCT c FROM SVConversationEntity c " +
                        "JOIN SVConversationParticipantEntity p ON p.conversation = c " +
                        "LEFT JOIN FETCH c.user1 " +
                        "WHERE p.user.id = :userId AND p.leftAt IS NULL AND p.hidden = false AND " +
                        "c.isDeleted = false AND " +
                        "c.conversationType = smolyanVote.smolyanVote.models.svmessenger.ConversationType.GROUP " +
                        "ORDER BY c.updatedAt DESC")
        List<SVConversationEntity> findActiveGroupsByUser(@Param("userId") Long userId);

        // ✅ NEW: Намира разговор включително hidden - за startOrGetConversation
        // Взема само най-новия разговор
        @Query(value = "SELECT c FROM SVConversationEntity c " +
                        "WHERE ((c.user1.id = :userId1 AND c.user2.id = :userId2) OR " +
                        "(c.user1.id = :userId2 AND c.user2.id = :userId1)) AND " +
                        "c.isDeleted = false AND " + DIRECT + " " +
                        "ORDER BY c.updatedAt DESC")
        List<SVConversationEntity> findByTwoUsersIncludingHidden(@Param("userId1") Long userId1,
                        @Param("userId2") Long userId2,
                        Pageable pageable);

        // EXISTS queries остават същите (не fetch-ват entities)
        @Query("SELECT COUNT(c) > 0 FROM SVConversationEntity c WHERE " +
                        "((c.user1.id = :userId1 AND c.user2.id = :userId2) OR " +
                        "(c.user1.id = :userId2 AND c.user2.id = :userId1)) AND " +
                        "c.isDeleted = false AND c.isHidden = false AND " + DIRECT)
        boolean existsBetweenUsers(@Param("userId1") Long userId1,
                        @Param("userId2") Long userId2);

        @Query("SELECT COUNT(c) FROM SVConversationEntity c WHERE " +
                        "(c.user1.id = :userId OR c.user2.id = :userId) AND " +
                        "c.isDeleted = false AND c.isHidden = false AND " + DIRECT)
        Long countActiveByUser(@Param("userId") Long userId);

        @Query("SELECT COUNT(c) FROM SVConversationEntity c WHERE " +
                        "((c.user1.id = :userId AND c.user1UnreadCount > 0) OR " +
                        "(c.user2.id = :userId AND c.user2UnreadCount > 0)) AND " +
                        "c.isDeleted = false AND c.isHidden = false AND " + DIRECT)
        Long countUnreadConversations(@Param("userId") Long userId);

        @Query("SELECT COALESCE(SUM(CASE " +
                        "WHEN c.user1.id = :userId THEN c.user1UnreadCount " +
                        "WHEN c.user2.id = :userId THEN c.user2UnreadCount " +
                        "ELSE 0 END), 0) " +
                        "FROM SVConversationEntity c WHERE " +
                        "(c.user1.id = :userId OR c.user2.id = :userId) AND " +
                        "c.isDeleted = false AND c.isHidden = false AND " + DIRECT)
        Long getTotalUnreadCount(@Param("userId") Long userId);

        @Modifying
        @Query("UPDATE SVConversationEntity c SET " +
                        "c.user1UnreadCount = CASE WHEN c.user1.id = :userId THEN 0 ELSE c.user1UnreadCount END, " +
                        "c.user2UnreadCount = CASE WHEN c.user2.id = :userId THEN 0 ELSE c.user2UnreadCount END " +
                        "WHERE c.id = :conversationId")
        void resetUnreadCount(@Param("conversationId") Long conversationId,
                        @Param("userId") Long userId);

        @Query("SELECT DISTINCT c FROM SVConversationEntity c " +
                        "LEFT JOIN FETCH c.user1 " +
                        "LEFT JOIN FETCH c.user2 " +
                        "WHERE (c.user1.id = :userId AND LOWER(c.user2.username) LIKE LOWER(CONCAT('%', :query, '%'))) OR "
                        +
                        "(c.user2.id = :userId AND LOWER(c.user1.username) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
                        "c.isDeleted = false AND c.isHidden = false " +
                        "ORDER BY c.updatedAt DESC")
        List<SVConversationEntity> searchByUsername(@Param("userId") Long userId,
                        @Param("query") String query);
}
