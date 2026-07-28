package smolyanVote.smolyanVote.repositories.svmessenger;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.svmessenger.SVConversationParticipantEntity;

import java.util.List;
import java.util.Optional;

@Repository
public interface SVConversationParticipantRepository
        extends JpaRepository<SVConversationParticipantEntity, Long> {

    @Query("SELECT p FROM SVConversationParticipantEntity p " +
            "JOIN FETCH p.user " +
            "WHERE p.conversation.id = :conversationId AND p.leftAt IS NULL " +
            "ORDER BY p.role, p.joinedAt")
    List<SVConversationParticipantEntity> findActiveByConversation(@Param("conversationId") Long conversationId);

    @Query("SELECT p FROM SVConversationParticipantEntity p " +
            "JOIN FETCH p.user " +
            "WHERE p.conversation.id IN :conversationIds AND p.leftAt IS NULL " +
            "ORDER BY p.role, p.joinedAt")
    List<SVConversationParticipantEntity> findActiveByConversations(@Param("conversationIds") List<Long> conversationIds);

    @Query("SELECT p FROM SVConversationParticipantEntity p " +
            "WHERE p.conversation.id = :conversationId AND p.user.id = :userId")
    Optional<SVConversationParticipantEntity> findByConversationAndUser(@Param("conversationId") Long conversationId,
                                                                       @Param("userId") Long userId);

    @Query("SELECT COALESCE(SUM(p.unreadCount), 0) FROM SVConversationParticipantEntity p " +
            "WHERE p.user.id = :userId AND p.leftAt IS NULL AND p.hidden = false " +
            "AND p.conversation.isDeleted = false")
    Long getTotalGroupUnread(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE SVConversationParticipantEntity p SET p.unreadCount = p.unreadCount + 1 " +
            "WHERE p.conversation.id = :conversationId AND p.leftAt IS NULL AND p.user.id <> :senderId")
    void incrementUnreadForOthers(@Param("conversationId") Long conversationId, @Param("senderId") Long senderId);

    @Modifying
    @Query("UPDATE SVConversationParticipantEntity p SET p.unreadCount = 0 " +
            "WHERE p.conversation.id = :conversationId AND p.user.id = :userId")
    void resetUnread(@Param("conversationId") Long conversationId, @Param("userId") Long userId);

    @Modifying
    @Query("UPDATE SVConversationParticipantEntity p SET p.hidden = false " +
            "WHERE p.conversation.id = :conversationId AND p.leftAt IS NULL")
    void unhideForAll(@Param("conversationId") Long conversationId);
}
