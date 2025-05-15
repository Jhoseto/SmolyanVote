package smolyanVote.smolyanVote.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.SimpleEventEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.VoteEntity;

import java.util.List;
import java.util.Optional;


@Repository
public interface VoteRepository extends JpaRepository<VoteEntity, Long> {
    boolean existsByUserAndEvent(UserEntity user, SimpleEventEntity event);

    Optional<VoteEntity> findByEventIdAndUserEmail(Long eventId, String userEmail);

    Optional<VoteEntity> findByUserIdAndEventId(Long userId, Long eventId);
}
