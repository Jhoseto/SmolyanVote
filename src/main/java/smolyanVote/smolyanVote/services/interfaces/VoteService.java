package smolyanVote.smolyanVote.services.interfaces;

import jakarta.transaction.Transactional;
import smolyanVote.smolyanVote.models.VoteReferendumEntity;
import smolyanVote.smolyanVote.models.VoteSimpleEventEntity;

public interface VoteService {

    @Transactional
    void recordVote(Long eventId, String voteValue, String userEmail);

    VoteSimpleEventEntity findByUserIdAndEventId(Long userId, Long eventId);

    VoteReferendumEntity findByUserIdAndReferendumId(Long userId, Long referendumId);

    Integer findVoteByReferendumIdAndUserEmail(Long referendumId, String userEmail);

    String recordReferendumVote(Long eventId, String voteValue, String userEmail);
}
