package smolyanVote.smolyanVote.repositories.svmessenger;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.svmessenger.CallHistoryEntity;

import java.util.List;

@Repository
public interface CallHistoryRepository extends JpaRepository<CallHistoryEntity, Long> {

    /**
     * Find all call history for a conversation, ordered by start time (newest first)
     */
    @Query("SELECT c FROM CallHistoryEntity c WHERE c.conversationId = :conversationId ORDER BY c.startTime DESC")
    List<CallHistoryEntity> findByConversationIdOrderByStartTimeDesc(@Param("conversationId") Long conversationId);

    /**
     * Find recent call history for a conversation (last N calls)
     */
    @Query("SELECT c FROM CallHistoryEntity c WHERE c.conversationId = :conversationId ORDER BY c.startTime DESC")
    List<CallHistoryEntity> findTopByConversationIdOrderByStartTimeDesc(@Param("conversationId") Long conversationId);
}
