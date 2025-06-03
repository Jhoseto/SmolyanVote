package smolyanVote.smolyanVote.services.interfaces;

import jakarta.transaction.Transactional;
import smolyanVote.smolyanVote.models.VoteReferendumEntity;
import smolyanVote.smolyanVote.models.VoteSimpleEventEntity;

import java.util.List;

public interface VoteService {

    @Transactional
    void recordSimpleEventVote(Long eventId, String voteValue, String userEmail);

    VoteSimpleEventEntity findByUserIdAndEventId(Long userId, Long eventId);

    VoteReferendumEntity findByUserIdAndReferendumId(Long userId, Long referendumId);

    String recordReferendumVote(Long eventId, String voteValue, String userEmail);

    @Transactional
    void recordMultiPollVote(Long pollId, String userEmail, List<Integer> selectedOptions);
}
