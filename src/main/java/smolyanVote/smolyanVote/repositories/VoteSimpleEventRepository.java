package smolyanVote.smolyanVote.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.ReferendumEntity;
import smolyanVote.smolyanVote.models.SimpleEventEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.VoteSimpleEventEntity;

import java.util.Optional;


@Repository
public interface VoteSimpleEventRepository extends JpaRepository<VoteSimpleEventEntity, Long> {
    boolean existsByUserAndEvent(UserEntity user, SimpleEventEntity event);

    Optional<VoteSimpleEventEntity> findByEventIdAndUserEmail(Long eventId, String userEmail);

    Optional<VoteSimpleEventEntity> findByUserIdAndEventId(Long userId, Long eventId);
}
