package smolyanVote.smolyanVote.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import smolyanVote.smolyanVote.models.MultiPollEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.VoteMultiPollEntity;

import java.util.List;

@Repository
public interface VoteMultiPollRepository extends JpaRepository<VoteMultiPollEntity, Long> {


    int countByMultiPoll_IdAndOptionText(Long multiPollId, String optionText);

    List<VoteMultiPollEntity> findAllByMultiPoll_IdAndUser_Id(Long multiPollId, Long userId);

    boolean existsByMultiPollIdAndUserId(Long multiPollId, Long userId);
}
