package smolyanVote.smolyanVote.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.EventEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.VoteEntity;


@Repository
public interface VoteRepository extends JpaRepository<VoteEntity, Long> {
    boolean existsByUserAndEvent(UserEntity user, EventEntity event);
}
