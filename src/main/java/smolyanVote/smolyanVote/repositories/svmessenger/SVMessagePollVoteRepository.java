package smolyanVote.smolyanVote.repositories.svmessenger;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.svmessenger.SVMessagePollVoteEntity;

import java.util.List;
import java.util.Optional;

@Repository
public interface SVMessagePollVoteRepository extends JpaRepository<SVMessagePollVoteEntity, Long> {

    @Query("SELECT v FROM SVMessagePollVoteEntity v JOIN FETCH v.option " +
            "WHERE v.messageId IN :messageIds")
    List<SVMessagePollVoteEntity> findByMessageIds(@Param("messageIds") List<Long> messageIds);

    Optional<SVMessagePollVoteEntity> findByMessageIdAndUserId(Long messageId, Long userId);
}
