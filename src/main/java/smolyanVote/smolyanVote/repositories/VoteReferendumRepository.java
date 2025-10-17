package smolyanVote.smolyanVote.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.annotations.LogActivity;
import smolyanVote.smolyanVote.models.*;
import smolyanVote.smolyanVote.models.enums.ActivityActionEnum;
import smolyanVote.smolyanVote.models.enums.ActivityTypeEnum;
import java.util.Optional;


@Repository
public interface VoteReferendumRepository extends JpaRepository<VoteReferendumEntity, Long> {
    boolean existsByUserAndReferendum(UserEntity user, ReferendumEntity event);

    Optional<VoteReferendumEntity> findByReferendum_IdAndUser_Id(Long referendumId, Long userId);

    @Transactional
    @LogActivity(action = ActivityActionEnum.DELETE_EVENT, entityType = ActivityTypeEnum.REFERENDUM)
    void deleteAllByReferendumId(Long referendumId);

}
