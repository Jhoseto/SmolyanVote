package smolyanVote.smolyanVote.services;

import jakarta.transaction.Transactional;
import smolyanVote.smolyanVote.models.VoteEntity;

public interface VoteService {

    @Transactional
    void recordVote(Long eventId, String voteValue, String userEmail);

    VoteEntity findByUserIdAndEventId(Long userId, Long eventId);
}
