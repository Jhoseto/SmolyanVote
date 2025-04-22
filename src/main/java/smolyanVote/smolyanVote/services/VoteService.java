package smolyanVote.smolyanVote.services;

public interface VoteService {
    void recordVote(Long eventId, String voteValue);
}
