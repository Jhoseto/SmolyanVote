package smolyanVote.smolyanVote.services;

import jakarta.transaction.Transactional;

public interface VoteService {

    @Transactional
    void recordVote(Long eventId, String voteValue, String userEmail);
}
