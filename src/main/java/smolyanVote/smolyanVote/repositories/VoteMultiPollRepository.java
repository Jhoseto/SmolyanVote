package smolyanVote.smolyanVote.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.annotations.LogActivity;
import smolyanVote.smolyanVote.models.VoteMultiPollEntity;
import smolyanVote.smolyanVote.models.enums.ActivityActionEnum;
import smolyanVote.smolyanVote.models.enums.ActivityTypeEnum;
import java.util.List;

@Repository
public interface VoteMultiPollRepository extends JpaRepository<VoteMultiPollEntity, Long> {


    int countByMultiPoll_IdAndOptionText(Long multiPollId, String optionText);

    List<VoteMultiPollEntity> findAllByMultiPoll_IdAndUser_Id(Long multiPollId, Long userId);

    boolean existsByMultiPollIdAndUserId(Long multiPollId, Long userId);

    @Transactional
    @LogActivity(action = ActivityActionEnum.DELETE_EVENT, entityType = ActivityTypeEnum.MULTI_POLL)
    void deleteAllByMultiPollId(Long eventId);
}
