package smolyanVote.smolyanVote.repositories.svmessenger;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.svmessenger.SVMessagePollOptionEntity;

import java.util.List;

@Repository
public interface SVMessagePollRepository extends JpaRepository<SVMessagePollOptionEntity, Long> {

    @Query("SELECT o FROM SVMessagePollOptionEntity o WHERE o.message.id IN :messageIds " +
            "ORDER BY o.message.id ASC, o.position ASC")
    List<SVMessagePollOptionEntity> findByMessageIds(@Param("messageIds") List<Long> messageIds);
}
