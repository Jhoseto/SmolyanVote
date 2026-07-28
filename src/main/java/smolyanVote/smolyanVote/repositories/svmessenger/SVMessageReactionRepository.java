package smolyanVote.smolyanVote.repositories.svmessenger;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.svmessenger.SVMessageReactionEntity;

import java.util.List;
import java.util.Optional;

@Repository
public interface SVMessageReactionRepository extends JpaRepository<SVMessageReactionEntity, Long> {

    @Query("SELECT r FROM SVMessageReactionEntity r JOIN FETCH r.user " +
            "WHERE r.message.id IN :messageIds ORDER BY r.createdAt ASC")
    List<SVMessageReactionEntity> findByMessageIds(@Param("messageIds") List<Long> messageIds);

    Optional<SVMessageReactionEntity> findByMessageIdAndUserIdAndEmoji(Long messageId, Long userId, String emoji);

    void deleteByMessageId(Long messageId);
}
