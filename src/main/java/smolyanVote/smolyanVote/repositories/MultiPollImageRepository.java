package smolyanVote.smolyanVote.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import smolyanVote.smolyanVote.models.MultiPollImageEntity;

import java.util.List;

public interface MultiPollImageRepository extends JpaRepository<MultiPollImageEntity, Long> {


    List<MultiPollImageEntity> findByMultiPoll_Id(Long multiPollId);
}
