package smolyanVote.smolyanVote.services.support;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import smolyanVote.smolyanVote.models.CommentsEntity;
import smolyanVote.smolyanVote.models.UserEntity;
import smolyanVote.smolyanVote.models.VoteMultiPollEntity;
import smolyanVote.smolyanVote.models.VoteReferendumEntity;
import smolyanVote.smolyanVote.models.VoteSimpleEventEntity;
import smolyanVote.smolyanVote.repositories.UserRepository;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Keeps {@link UserEntity} reputation counters in sync when content is created or
 * removed (including admin moderation). {@link ReputationCalculator} reads these fields.
 */
@Service
public class ReputationCounterService {

    private final UserRepository userRepository;

    public ReputationCounterService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public void incrementComments(UserEntity user) {
        if (user == null) {
            return;
        }
        user.setCommentsCount(user.getCommentsCount() + 1);
        userRepository.save(user);
    }

    public void incrementUserEvents(UserEntity user) {
        if (user == null) {
            return;
        }
        user.setUserEventsCount(user.getUserEventsCount() + 1);
        userRepository.save(user);
    }

    @Transactional
    public void onCommentsRemoved(Collection<CommentsEntity> comments) {
        if (comments == null || comments.isEmpty()) {
            return;
        }
        Map<String, Integer> byAuthor = new HashMap<>();
        for (CommentsEntity comment : comments) {
            if (comment.getAuthor() == null || comment.getAuthor().isBlank()) {
                continue;
            }
            byAuthor.merge(comment.getAuthor(), 1, Integer::sum);
        }
        byAuthor.forEach(this::decrementCommentsByUsername);
    }

    public void decrementCommentsByUsername(String username, int count) {
        if (username == null || username.isBlank() || count <= 0) {
            return;
        }
        userRepository.findByUsername(username).ifPresent(user -> {
            user.setCommentsCount(Math.max(0, user.getCommentsCount() - count));
            userRepository.save(user);
        });
    }

    public void decrementUserEventsByCreator(String creatorUsername) {
        if (creatorUsername == null || creatorUsername.isBlank()) {
            return;
        }
        userRepository.findByUsername(creatorUsername).ifPresent(user -> {
            user.setUserEventsCount(Math.max(0, user.getUserEventsCount() - 1));
            userRepository.save(user);
        });
    }

    @Transactional
    public void revertSimpleEventVotes(List<VoteSimpleEventEntity> votes) {
        if (votes == null) {
            return;
        }
        for (VoteSimpleEventEntity vote : votes) {
            UserEntity voter = vote.getUser();
            if (voter == null) {
                continue;
            }
            voter.setTotalVotes(Math.max(0, voter.getTotalVotes() - 1));
            userRepository.save(voter);
        }
    }

    @Transactional
    public void revertReferendumVotes(List<VoteReferendumEntity> votes) {
        if (votes == null) {
            return;
        }
        for (VoteReferendumEntity vote : votes) {
            UserEntity voter = vote.getUser();
            if (voter == null) {
                continue;
            }
            voter.setTotalVotes(Math.max(0, voter.getTotalVotes() - 1));
            userRepository.save(voter);
        }
    }

    /**
     * Multi-poll stores one {@link VoteMultiPollEntity} row per selected option, but
     * user reputation counts one vote per poll submission ({@code VoteServiceImpl}).
     */
    @Transactional
    public void revertMultiPollVotes(List<VoteMultiPollEntity> votes) {
        if (votes == null || votes.isEmpty()) {
            return;
        }
        Map<Long, Integer> decrementByUserId = new HashMap<>();
        for (VoteMultiPollEntity vote : votes) {
            UserEntity voter = vote.getUser();
            if (voter == null || voter.getId() == null) {
                continue;
            }
            decrementByUserId.merge(voter.getId(), 1, Integer::sum);
        }
        for (Map.Entry<Long, Integer> entry : decrementByUserId.entrySet()) {
            userRepository.findById(entry.getKey()).ifPresent(user -> {
                user.setTotalVotes(Math.max(0, user.getTotalVotes() - 1));
                userRepository.save(user);
            });
        }
    }
}
