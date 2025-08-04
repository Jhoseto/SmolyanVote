package smolyanVote.smolyanVote.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.annotations.LogActivity;
import smolyanVote.smolyanVote.models.ReferendumEntity;
import smolyanVote.smolyanVote.models.SimpleEventEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.VoteSimpleEventEntity;
import smolyanVote.smolyanVote.models.enums.ActivityActionEnum;
import smolyanVote.smolyanVote.models.enums.EventType;

import java.util.Optional;


@Repository
public interface VoteSimpleEventRepository extends JpaRepository<VoteSimpleEventEntity, Long> {
    boolean existsByUserAndEvent(UserEntity user, SimpleEventEntity event);

    Optional<VoteSimpleEventEntity> findByUserIdAndEventId(Long userId, Long eventId);

    @Transactional
    @LogActivity(action = ActivityActionEnum.DELETE_EVENT, entityType = EventType.SIMPLEEVENT)
    void deleteAllByEventId(Long eventId);

}
